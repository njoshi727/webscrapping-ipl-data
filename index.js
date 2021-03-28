const request = require("request");
const cheerio = require("cheerio");
const fs = require('fs'); 
const path = require('path');


//Making ipl folder in current working directory
var dir = './ipl-data';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

//Making request to webpage using request module
let url = "https://www.espncricinfo.com/series/ipl-2020-21-1210595";
request(url,(err,rsponse,html)=>{
    if(err){
        console.log("err");
    }else{
        extractHtml(html);
    }
});

function extractHtml(html){
    let selectorTool = cheerio.load(html);
    let allMatchInfoLinks = selectorTool("a.match-info-link-SIDEBAR");
    for(let i=0;i<allMatchInfoLinks.length;i++){
        let matchLink = "https://www.espncricinfo.com/"+selectorTool(allMatchInfoLinks[i]).attr("href");
        request(matchLink,(err,response,html)=>{
            if(err){
                console.log("err");
            }else{
                extractMatchHtml(html);
            }
        })
    }
}

function extractMatchHtml(html){
    let selectorTool = cheerio.load(html);
    let teamNameElements = selectorTool(".header-title.label");
    let teamnames = [];
    for(let i=0;i<2;i++){
        teamnames.push(selectorTool(teamNameElements[i]).text().split("INNINGS")[0].trim());
        let teamNameDir = path.join(dir,teamnames[i]);
        if (!fs.existsSync(teamNameDir)){
            fs.mkdirSync(teamNameDir);
        }
    }
    
    let batsmanTable = selectorTool(".table.batsman");
    for(let i=0;i<batsmanTable.length;i++){
        let batsmanRows = selectorTool(batsmanTable[i]).find("tbody tr");
        for(let row = 0;row<batsmanRows.length-1;row+=2){
            let batsmanRow = selectorTool(batsmanRows[row]).find("td");
            let batsmanName = selectorTool(batsmanRow[0]).text().trim();
            
            let batsmanJsonPath = path.join(dir,teamnames[i],batsmanName) +".json";
            //console.log(batsmanJsonPath);
            if (!fs.existsSync(batsmanJsonPath)){
                fs.writeFileSync(batsmanJsonPath,"[]");
            }

            let venueAndDate = selectorTool(".match-info.match-info-MATCH .description").text().split(",");
            let result = selectorTool(".match-info.match-info-MATCH .status-text").text().trim();
            let obj = {R : parseInt(selectorTool(batsmanRow[2]).text().trim()),
                B : parseInt(selectorTool(batsmanRow[3]).text().trim()),
                four : parseInt(selectorTool(batsmanRow[5]).text().trim()),
                six : parseInt(selectorTool(batsmanRow[6]).text().trim()),
                SR : parseFloat(selectorTool(batsmanRow[7]).text().trim()),
                venue : venueAndDate[1].trim(),
                date : venueAndDate[2].trim(),
                res : result
            }

            let batsmanjson = fs.readFileSync(batsmanJsonPath,"utf-8");
            //transform a json string into a javascript array
            let batsmanArray = JSON.parse(batsmanjson);
            //append an object to an array
            batsmanArray.push(obj);
            //transform back the array into a json string
            batsmanjson = JSON.stringify(batsmanArray);
            //save the json file
            fs.writeFileSync(batsmanJsonPath,batsmanjson,"utf-8");
        }
    }
}
