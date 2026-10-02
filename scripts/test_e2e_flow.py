import urllib.request
import urllib.error
import json
import time

BASE_URL = 'http://localhost:8080/api/v1'

def api_call(method, path, data=None, token=None, headers_extra=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    if headers_extra:
        headers.update(headers_extra)
    
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        return e.code, json.loads(content) if content else {}

print("=== Starting End-to-End System Test ===")

# 1. Admin login
status, res = api_call('POST', '/auth/login', {'email': 'admin@bloodbank.org', 'password': 'Admin@123'})
assert status == 200, f"Admin login failed: {res}"
admin_token = res['accessToken']
print("1. Admin Login: SUCCESS")

# 2. Admin creates staff user
ts = int(time.time())
staff_email = f"staff_{ts}@bloodbank.org"
status, res = api_call('POST', '/admin/staff', {
    'email': staff_email,
    'password': 'StaffPassword123!',
    'fullName': 'Nurse Jane',
    'phone': '9876543210'
}, token=admin_token)
assert status == 201, f"Create staff failed: {res}"
staff_id = res['id']
print(f"2. Admin Created Staff ({staff_email}): SUCCESS")

# 3. Staff logs in
status, res = api_call('POST', '/auth/login', {'email': staff_email, 'password': 'StaffPassword123!'})
assert status == 200, f"Staff login failed: {res}"
staff_token = res['accessToken']
print("3. Staff Login: SUCCESS")

# 4. Donor registers
donor_email = f"donor_{ts}@test.com"
status, res = api_call('POST', '/auth/register/donor', {
    'email': donor_email,
    'password': 'DonorPassword123!',
    'fullName': 'John Donor',
    'phone': '9123456789',
    'bloodGroup': 'O+',
    'dob': '1995-05-15',
    'gender': 'MALE',
    'weightKg': 72.5,
    'city': 'Metropolis'
})
assert status == 201, f"Donor registration failed: {res}"
print(f"4. Donor Registered ({donor_email}): SUCCESS")

# Donor logs in
status, res = api_call('POST', '/auth/login', {'email': donor_email, 'password': 'DonorPassword123!'})
assert status == 200, f"Donor login failed: {res}"
donor_token = res['accessToken']

# 5. Donor checks profile and eligibility
status, profile = api_call('GET', '/donors/me', token=donor_token)
assert status == 200, f"Get donor profile failed: {profile}"
donor_id = profile['id']
assert profile['bloodGroup'] == 'O+'
print(f"5. Donor Profile Retrieved (ID {donor_id}, Group O+): SUCCESS")

status, elig = api_call('GET', '/donors/me/eligibility', token=donor_token)
assert status == 200 and elig['eligible'] is True, f"Donor eligibility failed: {elig}"
print("6. Donor Eligibility Checked (Eligible: True): SUCCESS")

# 6. Hospital registers
hospital_email = f"hospital_{ts}@test.com"
status, res = api_call('POST', '/auth/register/hospital', {
    'email': hospital_email,
    'password': 'HospitalPassword123!',
    'name': f'St. Jude Hospital {ts}',
    'licenseNo': f'LIC-{ts}',
    'contactPerson': 'Dr. House',
    'phone': '9000000001',
    'city': 'Metropolis',
    'address': '100 Medical Blvd'
})
assert status == 201, f"Hospital registration failed: {res}"
hospital_user_id = res['id']
print(f"7. Hospital Registered ({hospital_email}): SUCCESS")

# 7. Admin approves hospital
status, hospitals_list = api_call('GET', '/hospitals?status=PENDING', token=admin_token)
matching_hosp = next((h for h in hospitals_list['content'] if h['licenseNo'] == f'LIC-{ts}'), None)
assert matching_hosp is not None, "Hospital not found in pending list"
hosp_profile_id = matching_hosp['id']

status, res = api_call('PATCH', f'/hospitals/{hosp_profile_id}/approval', {
    'decision': 'APPROVED',
    'reason': 'Verified state license credentials'
}, token=admin_token)
assert status == 200 and res['approvalStatus'] == 'APPROVED', f"Hospital approval failed: {res}"
print(f"8. Admin Approved Hospital Profile {hosp_profile_id}: SUCCESS")

# 8. Staff records donation for donor
status, donation = api_call('POST', '/donations', {
    'donorId': donor_id,
    'donationDate': '2026-10-01',
    'volumeMl': 450,
    'notes': 'Normal donation flow'
}, token=staff_token)
assert status == 201, f"Record donation failed: {donation}"
donation_id = donation['id']
print(f"9. Staff Recorded Donation (ID {donation_id}): SUCCESS")

# 9. Staff passes screening -> creates inventory unit
status, screened = api_call('PATCH', f'/donations/{donation_id}/screening', {
    'status': 'PASSED'
}, token=staff_token)
assert status == 200 and screened['unitNumber'] is not None, f"Screening failed: {screened}"
unit_number = screened['unitNumber']
print(f"10. Staff Passed Screening -> Unit Generated ({unit_number}): SUCCESS")

# 10. Hospital logs in and creates blood request
status, res = api_call('POST', '/auth/login', {'email': hospital_email, 'password': 'HospitalPassword123!'})
assert status == 200, f"Hospital login failed: {res}"
hospital_token = res['accessToken']

status, blood_req = api_call('POST', '/requests', {
    'bloodGroup': 'O+',
    'unitsRequested': 1,
    'priority': 'EMERGENCY',
    'requiredBy': '2026-10-03T12:00:00Z',
    'patientNote': 'Critical emergency trauma unit'
}, token=hospital_token)
assert status == 201, f"Create blood request failed: {blood_req}"
request_id = blood_req['id']
print(f"11. Hospital Created Emergency Request (ID {request_id}, ReqNo {blood_req['requestNo']}): SUCCESS")

# 11. Staff views queue, checks availability, and approves & issues blood
status, queue = api_call('GET', '/requests/queue?status=PENDING', token=staff_token)
assert status == 200 and any(r['id'] == request_id for r in queue['content']), "Request not in staff queue"

status, avail = api_call('GET', f'/requests/{request_id}/availability', token=staff_token)
assert status == 200 and avail['sufficientExact'] is True, f"Availability check failed: {avail}"
print(f"12. Staff Verified Availability (Exact available: {avail['exactAvailable']}): SUCCESS")

status, issue_res = api_call('POST', f'/requests/{request_id}/approve-and-issue', token=staff_token)
assert status == 200 and issue_res['status'] == 'FULFILLED', f"Approve and issue failed: {issue_res}"
issued_units = issue_res['issuedUnits']
assert len(issued_units) == 1 and issued_units[0]['unitNumber'] == unit_number
print(f"13. Staff Approved and Issued Unit ({unit_number}) for Request {request_id}: SUCCESS")

# 12. Hospital checks request status is FULFILLED
status, my_reqs = api_call('GET', '/requests/mine', token=hospital_token)
fulfilled_req = next((r for r in my_reqs['content'] if r['id'] == request_id), None)
assert fulfilled_req is not None and fulfilled_req['status'] == 'FULFILLED'
print("14. Hospital Confirmed Request FULFILLED with Issued Units: SUCCESS")

# 13. Admin checks dashboard
status, dash = api_call('GET', '/admin/dashboard', token=admin_token)
assert status == 200
print(f"15. Admin Dashboard Metrics (Pending requests: {dash['pendingRequests']}, Stock rows: {len(dash['stockByGroup'])}): SUCCESS")

print("\nALL 15 END-TO-END WORKFLOW CHECKS PASSED PERFECTLY!")
