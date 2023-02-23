const express = require("express");
const path = require("path");
const multer = require("multer");
const app = express();
const csv = require('csvtojson');
//const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const xl = require('excel4node');
const wb = new xl.Workbook();
const ws = wb.addWorksheet('Worksheet Name'); 
const { createCanvas } = require('canvas');
const fs = require('fs');
const Chart = require('chart.js');



const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
    
  },
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


const upload = multer({ storage: fileStorageEngine });


app.post("/single", upload.single("image"), async(req, res) => {
  try{
  //console.log(req.file);
  const filePath = req.file.path;
  const jsonArray = await csv().fromFile(filePath);
  const filteredJsonArr = jsonArray.filter(row => {
    return Object.values(row).every(value => value !== '');
  });
  console.log(filteredJsonArr,"+++++++++++");


   // Add serial number column
   const AddserialNum = filteredJsonArr.map((row, index) => {
    row["SrNo"] = index + 1;
    return row;
  });
  console.log(AddserialNum,"===============");


  const headingColumnNames = [
    "First Name",
    "Last Name",
    "Gender",
    "Country",
    "Age",
    "Date",
    "Id",
    "SrNo"
]
//Write Column Title in Excel file
let headingColumnIndex = 1;
headingColumnNames.forEach(heading => {
    ws.cell(1, headingColumnIndex++)
        .string(heading)
});

let rowIndex = 2;
AddserialNum.forEach( record => {
    let columnIndex = 1;
    Object.keys(record ).forEach(columnName =>{
        ws.cell(rowIndex,columnIndex++)
            .string(record [columnName])
    });
    rowIndex++;
}); 
const filename = `${req.file.originalname}.xlsx`;
wb.write(`public/${filename}`);
const excelFilePath = `public/${filename}`;


  // Count number of males and females in data array
  const genderCounts = AddserialNum.reduce((counts, row) => {
    if (row['Gender'] === 'Male') {
      counts.male += 1;
    } else if (row['Gender'] === 'Female') {
      counts.female += 1;
    }
    return counts;
  }, { male: 0, female: 0 });

   // Calculate gender ratio
   //const genderRatio = genderCounts.male / genderCounts.female;


    // Create new pie chart
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Male', 'Female'],
        datasets: [{
          data: [genderCounts.male, genderCounts.female],
          backgroundColor: ['blue', 'pink']
        }]
      }
    });


    
    // Write chart image to file
     const chartFilePath = `public/${req.file.originalname.replace('.csv', '')}.png`;
     const chartStream = canvas.createPNGStream();
     const chartWriteStream = fs.createWriteStream(chartFilePath);
     chartStream.pipe(chartWriteStream);
     return res.send({ excelFilePath, chartFilePath });
     
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal server error');
  }  
});



app.listen(3000, function () {
    console.log('app listening on port 3000!');
});