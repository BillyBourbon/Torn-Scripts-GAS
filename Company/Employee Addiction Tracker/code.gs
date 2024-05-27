// Employee tracker
// for use in a standalone or bound google apps script project
const api_key= `` || PropertiesService.getScriptProperties().getProperty(`apikey`) //Torn Api Key - Limited Access Or Higher.
const discord_url = `` || PropertiesService.getScriptProperties().getProperty(`discordurl`) //Discord Webhook Url For The Channel You Wish To Be Messaged In
const color = 663399 //Colour for the discord embed
const max_addiction = -20 //Max addiction allowed before an alert is sent
const max_inactivity = -20 //Max addiction allowed before an alert is sent
//Setup Script
function setup(){
  // checks if the api key and discord urls have been entered on lines 3 and 4
  if(api_key == null || api_key == `` || api_key?.length != 16) return console.log(`Enter apikey into script on line 3`)
  if(discord_url == null || discord_url == ``) return console.log(`Enter discord webhook url on line 4`)
  //deletes old triggers so the script doesnt run multiple times per end of day
  deactivate()
  // gets company data to get the director
  let dataCompany = JSON.parse(UrlFetchApp.fetch(`https://api.torn.com/company/?selections=profile,employees&key=${api_key}`).getContentText())
  let { director } = dataCompany
  // get directors discord id
  let dataDirector = JSON.parse(UrlFetchApp.fetch(`https://api.torn.com/user/${director}?selections=basic,discord&key=${api_key}`).getContentText())
  // save directors discord id and the trigger id to the script properties
  PropertiesService.getScriptProperties().setProperty(`directorsDiscordId`,dataDirector.discord.discordID)
  console.log(`Director setup: `,PropertiesService.getScriptProperties().getProperty(`directorsDiscordId`))
  let trigger = ScriptApp.newTrigger(`main`).timeBased().atHour(19).everyDays(1).inTimezone(`Etc/UTC`).create()
  PropertiesService.getScriptProperties().setProperty(`triggerId`,trigger.getUniqueId())
  console.log(`Trigger Setup Succesfull`)
}
//Deactivate Script
function deactivate(){
  let deleteTrigger = deleteTriggers([PropertiesService.getScriptProperties().getProperty(`triggerId`)])
  if(deleteTrigger.length > 0){
    console.log(`Unsucesfull. please delete trigger manually`)
  } else{ console.log(`Succesfull Deactivation`) }
}

//Run Script
function main(){  
  get_company()
}
//Sets up the message to send to the discord channel
let output_discord = {
  "username":"Employee Tracker", //Username of the script when it posts through the webhook
  "embeds":[],
  "content":``
  }


//Get key bearers company and creates an embed which is then sent to discord
function get_company(){
  let data = JSON.parse(UrlFetchApp.fetch(`https://api.torn.com/company/?selections=profile,employees&key=${api_key}`))
  let embed_company = summary_company(data.company)
  let sum_employees = summary_employees(data.company_employees)
  embed_company.fields[0].value += `\nAverage Efficiency: ${Math.round(sum_employees[1],1)}`
  output_discord.embeds.push(embed_company,sum_employees[0])
  if(Object.keys(sum_employees[2].fields).length > 0){ 
    output_discord.embeds.push(sum_employees[2]) 
    output_discord.content += `<@${PropertiesService.getScriptProperties(`directorsDiscordId`)}5> Some People Are Inactive Or Have High Addiction`
  }
  send_to_discord(output_discord)
}
//Creates a summary of the company 
function summary_company(company){
  let {name, rating, director, employees_hired,employees_capacity,daily_income,daily_customers,weekly_income, weekly_customers, days_old} = company
  let embed = {
    "name":`${name} Company Summary`,
    "color":color,
    "fields":[]
    }
  embed.fields.push({
    "name":`Summary`,
    "value":`Income (Daily | Weekly): ${formatter.format(daily_income)} | ${formatter.format(weekly_income)}\nCustomers (Daily | Weekly): ${daily_customers.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')} | ${weekly_customers.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}\nCompany Rating: ${rating} | Company Age: ${days_old}\nEmployees (Hired | Capacity): ${employees_hired} | ${employees_capacity}`,
    "inline":true
  })
  return embed
}
//Creates a summary of the employees
function summary_employees(companyemployees){
  let embed = {
    "name":`Employee Summary`,
    "color":color,
    "fields":[],
    "footer":{
      "text":`Max Allowed Addiction: ${max_addiction} | Max Inactivity: ${max_inactivity} `
    }
  }
  let embed_warnings = {
    "name":`Addiction And Inactivity Warning`,
    "color":15548997,
    "fields":[],
    "footer":{
      "text":`Max Allowed Addiction: ${max_addiction} | Max Inactivity: ${max_inactivity} `
    }
  }
  let total_efficiency = 0
  Object.keys(companyemployees).forEach( user_id =>{
    let {name, position, days_in_company, manual_labor, intelligence, endurance, effectiveness, last_action, status} = companyemployees[user_id]
    let effectiveness_negative = 0
    total_efficiency += effectiveness.total
    if(effectiveness.addiction){
      effectiveness_negative += Number(effectiveness?.addiction)
      if(effectiveness.addiction <= max_addiction) {
        embed_warnings.fields.push({
          "name":`${name} [${user_id}] | ADDICTION TOO HIGH (${effectiveness.addiction})`,
          "value":`Position: ${position} | Days In Company: ${days_in_company}\nTotal Effectiveness: ${effectiveness.total} | Without Addiction or Inactivity: ${effectiveness.total-effectiveness_negative}\nLast Action Was ${last_action.relative}`,
          "inline":true
        })
      }
    }
    if(effectiveness.inactivity){
      effectiveness_negative += Number(effectiveness?.inactivity)
      if(effectiveness.inactivity <= max_inactivity) {
        embed_warnings.fields.push({
          "name":`${name} [${user_id}] | INACTIVE (${effectiveness.inactivity})`,
          "value":`Position: ${position} | Days In Company: ${days_in_company}\nTotal Effectiveness: ${effectiveness.total} | Without Addiction or Inactivity: ${effectiveness.total-effectiveness_negative}\nLast Action Was ${last_action.relative}`,
          "inline":true
        })
      }
    }
    embed.fields.push({
      "name":`${name} [${user_id}] | ${position} | ${effectiveness.total}${(function (){if(effectiveness_negative < 0) {return `(${effectiveness_negative.toString()})`}else{return ``}})()}`,
      "value":`**Work Stats**\nManual Labor: ${manual_labor.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}\nEndurance: ${endurance.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}\nIntelligence: ${intelligence.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}\n**Effectivness**\nWork Stats: ${effectiveness.working_stats} | Settled Bonus: ${effectiveness.settled_in} | Director Bonus: ${effectiveness.director_education}| Merit Bonus: ${effectiveness.merits}`,
      "inline":true
    })
    
  })
  return [embed, (total_efficiency/(Object.keys(companyemployees).length)), embed_warnings]
}
//Sends output to discord
function send_to_discord(){
  let payload = JSON.stringify(output_discord)
  let params={
    method:"POST",
    contentType:"application/json",
    muteHttpExceptions:true,
    payload:payload,
    }
  let res = UrlFetchApp.fetch(discord_url,params)
}

const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
})
//Takes an array of trigger unique IDs and attempts to delete them.
//if it deletes a trigger it will remove it from the array and then once complete will return the array
//if succesfull the array will be empty
function deleteTriggers(triggerIds = []){
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(trigger=>{
    if(!triggerIds.includes(trigger.getUniqueId())) return
    ScriptApp.deleteTrigger(trigger)
    triggerIds.splice(triggerIds.indexOf(trigger.getUniqueId(),1))
  })
  return triggerIds
}
