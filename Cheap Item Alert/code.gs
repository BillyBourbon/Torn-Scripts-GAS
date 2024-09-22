// =================================== Discord Settings ===================================

// Set Webhook Url
const webhookUrl = ``
// Set Webhooks Username
const webhookUsername = `Bilbos Intern`
// Set Players Discord IDs To Ping
const discordsToPing = [ `729793559594795029` ]

// =================================== Api Settings ===================================

// Get Api Key
const apiKey = PropertiesService.getUserProperties().getProperty(`apikey`) || ``
// Init Torn Api Libary (V6)
const api = TornApi.api(apiKey)

// =================================== Script Settings ===================================

// Percent less than market value to be pinged by webhook. 100% = 100, 1% = 1
const alertPercent = 9
// Limit the number of item market entries shown in an alert. enter null to remove the cap. 
// reccomended setting: 3
const limitItemmarketAlerts = 3
// Limit the number of Bazaar entries shown in an alert. enter null to remove the cap. 
// reccomended setting: null
const limitBazaarAlerts = null
// Item IDs to check. Reccomend [ 405 ] :P
let itemIdsToCheck = [ 405, 206]
// Item IDs to never alert to. used in combination with the catergories check
let itemIdsToNeverCheck = [ 1149 ]
// Accepted Catergories: [ `Melee`,`Secondary`,`Primary`,`Defensive`,`Candy`,`Other`,`Special`,`Material`,`Clothing`,`Jewelry`,`Tool`,`Medical`,`Collectible`,`Car`,`Flower`,`Booster`,`Unused`,`Alcohol`,`Plushie`,`Drug`,`Temporary`,`Supply Pack`,`Enhancer`,`Artifact`,`Energy Drink`,`Book`]
const catergoriesToCheck = [ `Energy Drink`,`Booster` ]

// =================================== Trigger Function ===================================

// Function for the trigger(5minute) to run. Uses main()
// Runs the cheap item alert script once a minute
function multiRunMain(){
  let runs = 5
  let timeout = 60
  while(runs > 0){
    console.log(`Runs Remaining ${runs}`)
    main()
    runs -= 1
    console.log(`Run Complete. Runs Left ${runs}`)
    if( runs > 0 ) Utilities.sleep(timeout*1000)
  }
  clearPastListingIds()
}

// =================================== Main Function ===================================

// Main Function
// Runs the cheap item alert script
function main(){
  viewPastListingIds()
  const tornItems = getTornItems()
  let additionalIds = []
  if( catergoriesToCheck.length > 0 ) {
    additionalIds = filterTornItemsByCatergory( catergoriesToCheck, tornItems)
    additionalIds.forEach(x=>{
      if(!itemIdsToCheck.includes(Number(x))) itemIdsToCheck.push(Number(x))
      })
    }
  itemIdsToCheck = itemIdsToCheck.filter(id=> !itemIdsToNeverCheck.includes(id))
  let itemsObj = {}
  itemIdsToCheck.forEach( itemId => {
    let { name, market_value } = tornItems[itemId]
    itemsObj[itemId] = {name:name,market_value:market_value}
    let marketData = getMarketData(itemId)
    itemsObj[itemId].bazaar = marketData.bazaar
    itemsObj[itemId].itemmarket = marketData.itemmarket
    })
  itemsObj = checkData(itemsObj)
  let filteredItems = Object.entries(itemsObj).filter(([key,value])=>value.bazaar.length > 0 || value.itemmarket.length > 0 )
  let embeds = genCheapItemAlertEmbed(filteredItems)
  let pingContent = buildContentPings(discordsToPing)
  sendToDiscord(webhookUrl,webhookUsername,pingContent,embeds)
}

// =================================== Helper Functions ===================================

// Dev cmd to show script property 
function viewPastListingIds(){
  let propKey = `pastListingIds`
  let prop = PropertiesService.getScriptProperties().getProperty(propKey)
  if(prop == null) return console.log(`No Property Set For Key: ${propKey}`)
  prop = prop.split(`,`) || []
  console.log(prop)
}
// Clears properties (cache)
function clearPastListingIds(){
  let propKey = `pastListingIds`
  console.log(`OLD LISTINGS`)
  viewPastListingIds()
  console.log(`WIPING`)
  PropertiesService.getScriptProperties().deleteProperty(propKey)
  console.log(`Wiped`)
}
// Merges params to create a 'unique' id. its not unique but it does the job
function createUniqueID(...params){
  let id = params.join(`-`)
  return id
}
// Creates the Embed/s to be outputted to Discord
// Input: Filtered Torn Items
// Output: Array of Embed/s
function genCheapItemAlertEmbed(items){
  let title = `Cheap Item Alerts`
  let fields = []
  let embeds = []


  let pastListingIds = PropertiesService.getScriptProperties().getProperty(`pastListingIds`)
  if(pastListingIds == null) {
    pastListingIds = []
  } else{
    pastListingIds = pastListingIds.split(`,`)
  }
  
  items.forEach(([id,value]) => {
    let { bazaar, itemmarket, name, market_value, adjustedMarketValue } = value
    let field = {
      'name':`${name} [${id}]`,
      'inline':true,
      'value':`Market Value: ${market_value}`
    }
    if(bazaar.length > 0 ) field.value+=`\n**-- Bazaar Listings --**`
    bazaar.forEach(listing=>{
      let { cost, quantity } = listing
      let costDif = market_value - cost
      let totalCost = quantity * cost
      let totalCostDif = costDif * quantity

      let uId = createUniqueID(name,id,cost,costDif,quantity,totalCost,totalCostDif)
      if(pastListingIds.includes(uId)) return 
      pastListingIds.push(uId)

      field.value+=`\nTotal Cost: ${totalCost}(${cost}) | Quantity: ${quantity} | Profit on Market Value: ${totalCostDif}`
    })
    if(itemmarket.length > 0 ) field.value+=`\n**-- Item Market Listings --**`
    itemmarket.forEach(listing=>{
      let { cost, quantity } = listing
      let costDif = market_value - cost
      let totalCost = quantity * cost
      let totalCostDif = costDif * quantity

      let uId = createUniqueID(name,id,cost,costDif,quantity,totalCost,totalCostDif)
      if(pastListingIds.includes(uId)) return console.log(`${uId} - Already Sent`)
      pastListingIds.push(uId)
      field.value+=`\nTotal Cost: ${totalCost}(${cost}), quantity: ${quantity}, Profit on Market Value: ${totalCostDif}`
    })
    fields.push(field)
  })
  while (fields.length > 0){
    let embedFields = fields.splice(0,9)
    let embed = buildEmbed(title,embedFields,null,null,`Current Percent To Alert At: ${alertPercent}%`)
    embeds.push(embed)
  }
  PropertiesService.getScriptProperties().setProperty(`pastListingIds`,pastListingIds.toString())
  return embeds
}

// Builds an Embed
// Input: Title, Fields, Colour(Optional), Description(Optional), Footer Text(Optional)
// Output: Embed
function buildEmbed(title, fields = [],color = 663399, description = null,footerText = null){
  let embed = {
    "name":title,
    "color":color,
    "fields":fields,
  }
  if(description) embed.description = description
  if(footerText) embed.footer = {"text":footerText}
  return embed
}

// Convert the Discord IDs of users into a message pinging the users
// Input: Array of Discord IDs
// Output: String
function buildContentPings(discordIDs){
  let content = ``
  discordIDs.forEach(id => {
    content+=`<@${id}>\n`
  })
  return content
}

// Checks the items for alerts
// Input: An Object containing item data. {key(item id):value(item data)}
// Output: Returns the object filtered
function checkData(itemsObj){
  Object.entries(itemsObj).forEach( ([itemId, data]) => {
    let { name, market_value, bazaar, itemmarket } = data
    let adjustedMarketValue = market_value * ((100-alertPercent)/100)
    itemsObj[itemId].adjustedMarketValue = adjustedMarketValue
    if(bazaar == null) {
      itemsObj[itemId].bazaar = []
    } else{
      let filteredBazaar = bazaar.filter(a=>a.cost <= adjustedMarketValue)
      if(limitBazaarAlerts !== null) filteredBazaar = filteredBazaar.slice(0,limitBazaarAlerts)
      itemsObj[itemId].bazaar = filteredBazaar
      }
    if(itemmarket == null) {
      itemsObj[itemId].itemmarket = []
    } else{
      let filteredItemmarket = itemmarket.filter(a=>a.cost <= adjustedMarketValue)         
      if(limitItemmarketAlerts !== null) filteredItemmarket = filteredItemmarket.slice(0,limitItemmarketAlerts)
      itemsObj[itemId].itemmarket = filteredItemmarket
      }
  })
  return itemsObj
}

// Get the market data of an item
// Input: Item ID
// Output: Market Data (Bazaar and Item Market) 
function getMarketData(itemId){
  let data = api.market(itemId).bazaar().itemmarket().fetch()
  return data

}

// Filters Items by catergory
// Input: Item Catergories, Torn Items
// Output: Torn Items Filtered
function filterTornItemsByCatergory( catergories, tornItems){
  let output = []
  if(!tornItems) tornItems = getTornItems()
  Object.entries(tornItems).forEach( ([itemId, data]) => {
    if(catergories.includes(data.type))  output.push(itemId)
  })
  return output
}

// Get Torns Items
// Input: None
// Output: Torn Items
function getTornItems(){
  let data = api.torn().items().fetch()
  return data.items
}

// Send message to discord
// Input: Wehbook Url of Channel, Webhook Username, Text Content, Embed Array
// Output: A message to the Discord Channel
function sendToDiscord(webhookUrl, webhookUsername = `Default Webhook Username`, content = null, embeds = null){
  if(embeds == null && content == null) return console.log(`Empty Message`)
  if(embeds.length == 0) return console.log(`No Embeds. Message Cancelled`)
  const output_discord = {
  "username":webhookUsername,
  }
  if( embeds && embeds.length > 0 ) output_discord.embeds = embeds
  if( content && content.length > 0 ) output_discord.content = content
  let payload = JSON.stringify(output_discord)
  let params={
    method:"POST",
    contentType:"application/json",
    muteHttpExceptions:true,
    payload:payload,
    }
  try{
    let res = UrlFetchApp.fetch(webhookUrl,params)
    console.log(`ct`,res.getContentText())
    console.log(payload)
  } catch(e){
    console.log(`ERROR!:`,e)
  }
}

// ====================================================================================
