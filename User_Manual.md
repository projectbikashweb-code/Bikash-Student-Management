# 🎓 Bikash Educational Institution - User Manual

Welcome to the **Bikash Educational Institution Management System**! This software was completely custom-built to help you run your institute efficiently, remove paperwork entirely, and drastically speed up fee collection. 

This manual is written specifically for the Staff and Admins. It breaks down what every feature does, **how** to use it, and exactly **when** you should use it.

---

## 1. Getting Started: The Dashboard
**What it is:** Your command center. When you first log in, you will see the total number of Active Students, Total Revenue, and Pending Collections at a glance.
**How to use it:** The left-hand sidebar is your navigation menu. Click on any section (Students, Fees, Invoices, Settings) to jump there immediately.
**When to do this:** Every morning when managing institute operations to get a daily health-check of your finances.

---

## 2. Settings & Initial Setup
**What it is:** The control panel where you define your institute's overall information.
**How to use it:** Click on **Settings** in the bottom left menu. 
- **Institute Info:** You can safely change the **Institute Email**, **Phone Number**, and **Default Due Date**.
- **Class-Specific Pricing:** You will see a grid listing every class (Class 1, Class 2, Class 11 Science...). You MUST type the standard monthly price next to each class. If left blank, the system falls back to a global Default Fee. 
- **Staff Users:** Manage staff accounts or change passwords.
**When to do this:** Do this **ONCE** right now before starting operations. Update the class pricing grid whenever tuition fees change across the institute.

---

## 3. Student Management (The Foundation)
**What it is:** A secure digital directory replacing your physical student registers.
**How to use it:** Click **Students**. 
- To add an enrollment, click the **"+ Add Student"** button. Fill in their Name, Class, School, Contact Number, and their Guardian's details.
- **Custom Monthly Fee Box:** If you want to give a student a sibling discount, type the discounted amount here. If you leave it empty, the student automatically gets billed the normal standard price defined in the Settings module.
- To view an entire student’s history, click on their row. You can immediately see a complete timeline of their entire fee history and past invoices.
**When to do this:** Every single time a new student walks through the door to enroll.

---

## 4. Fee Management (The Financial Heart)
**What it is:** This handles calculating mathematically exactly who owes you money, and how much.

### A. Assigning Monthly Fees (Bulk Assign)
**What it is:** Assigning the regular monthly bill to active students.
**How to use it:** On the Fee Management page, click **"Bulk Assign"**. 
- Select a specific month (e.g., "May 2026").
- Check the boxes next to your desired students or click "Select All".
- Hit **"Assign Fees"**. (Notice there is no box asking you to type an amount. The system uses a smart engine to calculate the cost. It first checks if the student has a Custom Override. If they don't, it looks at Settings to find the standard Class Tier price, making sure everyone is billed flawlessly).
**When to do this:** The **1st day of every month**.

### B. Recording a Payment
**What it is:** Logging cash, UPI, or Cheque payments when parents pay.
**How to use it:** Search for the student. If they haven't paid, their status is <span style="color:red">PENDING</span>.
- Click the **Credit Card Icon** (Record Payment).
- Enter the amount they are paying today. 
  - *Note on Partial Payments:* If their total fee is ₹2000, and they only pay ₹1000 today, the system will accurately mark them as <span style="color:orange">PARTIAL</span> and list a remaining balance of ₹1000. When they come back next week to pay the remaining ₹1000, it automatically hits <span style="color:green">PAID</span>.
- Alternatively, if they pay the exact full amount in cash, simply click the **Checkmark Icon** to instantly mark them fully paid in one click. 
**When to do this:** Instantly, the very second cash or UPI drops into your account.

### C. Deleting Accidental Fees
**What it is:** Removing duplicate entries.
**How to use it:** If a staff member created two May records for Aman, look for the little red **Trash Can Icon**. Only `PENDING` records are allowed to be deleted (to protect your financial logs).
**When to do this:** As soon as you spot an accidental clone.

---

## 5. Invoicing Engine
**What it is:** The system that creates beautiful, legally compliant digital receipts.
**How to use it:** Every time a fee is marked as Partial or Paid, an invoice is generated automatically. Go to the **Invoices** page.
- Note the Invoice Numbers (e.g. `BEI-2026-0001`).
- Click the row to visually **Preview** the invoice. It includes your logo, a "Computer Generated" stamp, and all items.
**When to do this:** Keep this open when parents ask for a visual breakdown of their payments.

---

## 6. WhatsApp Reminders & Sharing
**What it is:** The fastest way to communicate with parents by automatically triggering specific `wa.me` links.
**How to use it:** 
- **For Sending Invoices:** Inside the Invoice Preview, click the green **WhatsApp** button. It will open your WhatsApp with a pre-written message containing a secure, public web-link. The parent clicks the link and views/downloads the branded PDF flawlessly on their phone without needing a login.
- **For Reminders:** Go to the "WhatsApp Reminders" tab. You can click to instantly request pending payments for overdue fees without ever having to type out "Dear Parent, your dues are..." manually.
**When to do this:** 
- Send the Invoice immediately after logging a payment. 
- Send Reminders on the 10th of every month for students actively marked "Pending".

---

## 7. Exporting Accounting Data
**What it is:** A secure way to pull data completely out of the software and into Excel for CA auditing.
**How to use it:** From the Students or Payments pages, use the **Export CSV** function. The system will bundle all selected rows into a clean spreadsheet file that downloads to your exact device.
**When to do this:** At the end of every financial quarter or fiscal year for CA accounting purposes.

---

### Final Safety Note
*This entire application is secured firmly with encrypted sessions. You can rest easy knowing that without your `admin@bikashinstitute.com` password, no one on the open internet can see your student information or financials.*
