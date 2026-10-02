import urllib.request
import urllib.parse
import json
import time
import mysql.connector

BASE_URL = "http://localhost:8080/api/v1"

def api_call(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            return status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}

def main():
    print("=================================================================")
    print("   END-TO-END CUSTOMER REGISTRATION, VERIFICATION & DB AUDIT   ")
    print("=================================================================")

    # MySQL connection with autocommit=True
    db = mysql.connector.connect(
        host="localhost",
        port=3306,
        user="bloodbank",
        password="bloodbank",
        database="bloodbank",
        autocommit=True
    )
    cursor = db.cursor(dictionary=True)

    timestamp = int(time.time())

    # -------------------------------------------------------------
    # 1. DONOR REGISTRATION AND VERIFICATION FLOW
    # -------------------------------------------------------------
    print("\n--- [TEST 1] NEW DONOR REGISTRATION & DATABASE PERSISTENCE ---")
    donor_email = f"donor.{timestamp}@testmail.com"
    donor_name = f"Priya Nair {timestamp}"
    donor_payload = {
        "fullName": donor_name,
        "email": donor_email,
        "password": "Password@123",
        "phone": "9876501234",
        "dob": "1997-08-22",
        "gender": "FEMALE",
        "weightKg": 58.5,
        "bloodGroup": "B+",
        "city": "Bengaluru"
    }

    status, reg_res = api_call("/auth/register/donor", "POST", donor_payload)
    print(f"  Register Donor API: Status={status}, ID={reg_res.get('id')}")
    assert status == 201, f"Expected 201, got {status}: {reg_res}"
    donor_user_id = reg_res["id"]

    # Direct MySQL verification for Donor
    cursor.execute("SELECT id, email, full_name, role, active FROM users WHERE id = %s", (donor_user_id,))
    db_donor_user = cursor.fetchone()
    print(f"  [MYSQL DIRECT] Found in `users`: ID={db_donor_user['id']}, Email={db_donor_user['email']}, Active={db_donor_user['active']}")
    assert db_donor_user["email"] == donor_email
    assert db_donor_user["active"] == 1

    cursor.execute("SELECT d.id, d.user_id, bg.code as blood_group, d.city FROM donor d JOIN blood_group bg ON d.blood_group_id = bg.id WHERE d.user_id = %s", (donor_user_id,))
    db_donor_profile = cursor.fetchone()
    print(f"  [MYSQL DIRECT] Found in `donor`: ProfileID={db_donor_profile['id']}, BloodGroup={db_donor_profile['blood_group']}, City={db_donor_profile['city']}")
    assert db_donor_profile["blood_group"] == "B+"

    # Donor immediate login test
    status_login, login_res = api_call("/auth/login", "POST", {
        "email": donor_email,
        "password": "Password@123"
    })
    print(f"  New Donor Login API: Status={status_login}, Role={login_res.get('user', {}).get('role')}")
    assert status_login == 200
    donor_token = login_res["accessToken"]

    # Verify donor can access protected endpoints
    status_elig, elig_res = api_call("/donors/me/eligibility", "GET", token=donor_token)
    print(f"  Donor Eligibility API: Status={status_elig}, Eligible={elig_res.get('eligible')}")
    assert status_elig == 200
    print("  [SUCCESS] Donor registration, database reflection, and login verified 100%!")

    # -------------------------------------------------------------
    # 2. HOSPITAL REGISTRATION, ADMIN VERIFICATION & ACTIVATION FLOW
    # -------------------------------------------------------------
    print("\n--- [TEST 2] NEW HOSPITAL REGISTRATION & ADMIN ACCREDITATION FLOW ---")
    hosp_email = f"hospital.{timestamp}@healthcare.org"
    hosp_name = f"Fortis Care Hospital {timestamp}"
    hosp_license = f"LIC-FORTIS-{timestamp}"
    hosp_payload = {
        "name": hosp_name,
        "licenseNo": hosp_license,
        "contactPerson": "Dr. Sandeep Mehta, CMO",
        "phone": "080-49202020",
        "city": "Bengaluru",
        "address": "154/9 Bannerghatta Main Road",
        "email": hosp_email,
        "password": "Password@123"
    }

    status_hosp_reg, hosp_reg_res = api_call("/auth/register/hospital", "POST", hosp_payload)
    print(f"  Register Hospital API: Status={status_hosp_reg}, ID={hosp_reg_res.get('id')}, Status={hosp_reg_res.get('hospitalApprovalStatus')}")
    assert status_hosp_reg == 201
    assert hosp_reg_res.get("hospitalApprovalStatus") == "PENDING"
    hosp_user_id = hosp_reg_res["id"]

    # Direct MySQL verification for Hospital
    cursor.execute("SELECT id, user_id, name, license_no, approval_status FROM hospital WHERE user_id = %s", (hosp_user_id,))
    db_hosp = cursor.fetchone()
    print(f"  [MYSQL DIRECT] Found in `hospital`: ID={db_hosp['id']}, Name={db_hosp['name']}, Status={db_hosp['approval_status']}")
    assert db_hosp["approval_status"] == "PENDING"
    assert db_hosp["license_no"] == hosp_license
    hospital_table_id = db_hosp["id"]

    # Admin Login to inspect pending hospital queue
    status_adm, adm_login = api_call("/auth/login", "POST", {
        "email": "admin@bloodbank.org",
        "password": "Demo@123"
    })
    admin_token = adm_login["accessToken"]

    status_list, pending_list = api_call("/hospitals?status=PENDING", "GET", token=admin_token)
    pending_ids = [h["id"] for h in pending_list.get("content", [])]
    print(f"  Admin Pending Hospital List: Status={status_list}, Hospital {hospital_table_id} in pending list: {hospital_table_id in pending_ids}")
    assert hospital_table_id in pending_ids

    # Admin verifies and approves the hospital
    status_approve, approve_res = api_call(f"/hospitals/{hospital_table_id}/approval", "PATCH", {
        "status": "APPROVED",
        "notes": "Verified state medical licensing and cold storage facilities."
    }, token=admin_token)
    print(f"  Admin Accreditation Decision API: Status={status_approve}, New Status={approve_res.get('approvalStatus')}")
    assert status_approve == 200
    assert approve_res.get("approvalStatus") == "APPROVED"

    # Direct MySQL verification after Admin approval
    cursor.execute("SELECT id, approval_status, decided_by, decided_at FROM hospital WHERE id = %s", (hospital_table_id,))
    db_hosp_approved = cursor.fetchone()
    print(f"  [MYSQL DIRECT] Verified in MySQL after Admin Approval: Status={db_hosp_approved['approval_status']}, DecidedBy Staff ID={db_hosp_approved['decided_by']}")
    assert db_hosp_approved["approval_status"] == "APPROVED"

    # Hospital logs in now as APPROVED institution
    status_hosp_login, hosp_login_res = api_call("/auth/login", "POST", {
        "email": hosp_email,
        "password": "Password@123"
    })
    print(f"  Hospital Login API: Status={status_hosp_login}, Approval Status={hosp_login_res.get('user', {}).get('hospitalApprovalStatus')}")
    assert status_hosp_login == 200
    assert hosp_login_res.get("user", {}).get("hospitalApprovalStatus") == "APPROVED"
    hosp_token = hosp_login_res["accessToken"]

    # Accredited Hospital can now create blood requisition
    status_req, req_res = api_call("/requests", "POST", {
        "bloodGroupId": 1,  # A+
        "unitsRequested": 2,
        "priority": "URGENT",
        "patientName": f"Patient-{timestamp}",
        "hospitalNotes": "Surgical backup units",
        "requiredBy": "2026-10-10T10:00:00Z"
    }, token=hosp_token)
    print(f"  Hospital Requisition API: Status={status_req}, RequestNo={req_res.get('requestNo')}")
    assert status_req == 201

    cursor.close()
    db.close()

    print("\n=================================================================")
    print("   ALL REGISTRATION, PERSISTENCE & VERIFICATION TESTS PASSED!   ")
    print("=================================================================")

if __name__ == "__main__":
    main()
