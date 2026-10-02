import mysql.connector

db = mysql.connector.connect(host='localhost', port=3306, user='bloodbank', password='bloodbank', database='bloodbank')
c = db.cursor(dictionary=True)

c.execute("SELECT id, email, full_name, role, active FROM users WHERE email='apollo.care@example.org'")
print("USER:", c.fetchone())

c.execute("SELECT id, user_id, name, license_no, approval_status, contact_person FROM hospital WHERE license_no='MED-LIC-APOLLO-999'")
print("HOSPITAL:", c.fetchone())

c.execute("SELECT id, email, full_name, role, active FROM users WHERE email='testnewdonor@example.com'")
print("DONOR USER:", c.fetchone())

c.execute("SELECT d.id, d.user_id, bg.code as blood_group, d.dob, d.gender, d.phone, d.city FROM donor d JOIN blood_group bg ON d.blood_group_id = bg.id WHERE d.user_id=116")
print("DONOR PROFILE:", c.fetchone())
