!important
read and analyze current system architecture

! important 
always refer to the two dirs i.e call-center-api and call-centre

!important
report your findings before execution. Always

# Features
* Following my current code architecture and context, I need you to build a login page that will authenticate users and take them to their respective dashboards.
* For admins they should be logged to their dashboards i.e following their designated roles. For now there are 3 designated admins: Call-Center Admins, Marketing Admins & Compliance Admin.
* Each admin dashboard should take the current layout for admin dashboards at /call-centre/src/app/admindashcc but now showing metrics and info for their respective agents

- A super admin dashboards should contain all metrics from across all the users.
- Be sure to get the dashboard inspirations from the existing component at /call-centre/src/app/admindashcc

# Working Logic
* You should be working hand in hand with files and dirs from /call-centre/call-center-api as it contains the current backend and api for the system.
* I'd advice to avoid using components from shadcn ui. You should follow my current code architecuture and create you own divs and tables; most of them don't have the famous rounded corners