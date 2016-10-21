**Prerequisites** 

1. Node.js >= 4.4.2
2. Npm >= 3.10.3 
3. Windows Platform (for Now)

----------

**Install sbf framework**

1. Clone repository to ./sbf-install
2. *cd sbf-install*
3. *npm link* (To make it available globally)
4.  Go to projects folder where you want to create application (Ex. *cd D:/projects*)
5. *sbf-install create -k &lt;GitLabAccountPrivateToken&gt; -n* &lt;NameOfApplication&gt; 
(Ex. *sbf-install create -k SRdUNraBHX611XC_m7VY -n helpdesk-bot*)
6. *cd &lt;NameOfApplication&gt;* (*cd helpdesk-bot*)
7. run start.bat
8. Navigate to http://localhost:3000/editor/ in browser

----------

**Install sbf Nodes & Flows**
1. Go to Application folder (Ex. *cd helpdesk-bot*)
2. sbf-install install  -k &lt;GitLabAccountPrivateToken&gt; -n &lt;SbfNodesPackageName&gt;  
(Ex. *sbf-install install  -k SRdUdraBHX781XC_m7VY -n node-red-contrib-sbf-helpdesk*)
3. Restart the application

----------


**Uninstall sbf Nodes & Flows**
1. Go to Application folder (Ex. *cd helpdesk-bot*)
2. sbf-install uninstall  -n &lt;SbfNodesPackageName&gt;  
(Ex. *sbf-install uninstall  -n node-red-contrib-sbf-helpdesk*)
3. Restart the application