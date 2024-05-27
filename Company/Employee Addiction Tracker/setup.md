How to setup

1. head over to https://script.google.com/home
2. from here create a new project
3. clear whats in the editor (see screenshot below for how yours should look)
4. ![image](https://github.com/BillyBourbon/Torn-Scripts-GAS/assets/87441988/93e07c4c-aebb-429f-8b1d-b1d669f09ece)
5. in the blank editor paste the code located in this folder in 'code.gs' into the editor 
6. make sure to enter your apikey, discord url and addiction/inactivity thresholds on the first few lines where the comments show
7. hit save once done (id also suggest naming the project instead of leaving it as untitled)

now that weve saved the script its time to set it up.

1. on the IDEs hotbar therell be a 'Run' button and a dropdown menu to the side of it. in the dropdown menu you wish to select 'Setup' then hit run (see screenshot below for help)
![image](https://github.com/BillyBourbon/Torn-Scripts-GAS/assets/87441988/5f9f8613-0bf1-431b-be85-0197d9ffde99)
2. once youve hit run a google prompt will appear. hit 'review permissions' and select your google account
![image](https://github.com/BillyBourbon/Torn-Scripts-GAS/assets/87441988/9d38f346-862f-46ba-b413-849c2d417f1c)
3. google will warn you this is an unverified app as your attemptin to exectute it through the script edito. to keep going youll need to hit 'advanced' (see screenshot below)
<img width="498" alt="image" src="https://github.com/BillyBourbon/Torn-Scripts-GAS/assets/87441988/dbedaf5a-ad5a-431d-b8a2-6d1dac8c40e4">
4. hit 'Go to project(unsafe)'
<img width="481" alt="image" src="https://github.com/BillyBourbon/Torn-Scripts-GAS/assets/87441988/7d528e47-ade8-4b0d-93db-1476bbcdbe1d">

5. a list of permissions the script needs will now show. this script requires the ability to connect to an external service (torn api and discord api) and to run  when your not around (enables the trigger to work so the script runs automatically at 1900TCT)
<img width="478" alt="image" src="https://github.com/BillyBourbon/Torn-Scripts-GAS/assets/87441988/4cb89889-fb98-48ba-acf4-b5d573c0d1cb">
6. Hit 'Allow'
7. if youve succesfully entered a valid discord webhook and torn apikey then the setup function will now run and youll be alerted of its progress in the execution log. if succesfull the script will run daily at 1900TCT. if it fails listen to what the log says or DM Bilbosaggings [2323763] in game or on discord
8. if you wish to deactivate the script at any time just run the 'deactivate' function from the editor

