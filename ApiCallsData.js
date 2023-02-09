import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';

const csvData = new SharedArray('another data name', function () {
    // Load CSV file and parse it using Papa Parse
    return papaparse.parse(open('./payLoadData.csv'), { header: true }).data;
  });


export const payload = JSON.stringify({
  username	: 'admin',
  password: 'password123',
});

export const params = {
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
};

export function payLoadForUser(userNo){
  let a = JSON.stringify({
    "firstname" : `${csvData[userNo].firstname}`,
    "lastname" : `${csvData[userNo].lastname}`,
    "totalprice" : csvData[userNo].totalprice,
    "depositpaid" : csvData[userNo].depositpaid,
    "bookingdates" : {
          "checkin" : `${csvData[userNo].checkin}`,
          "checkout" : `${csvData[userNo].checkout}`
      },
    "additionalneeds" : `${csvData[userNo].additionalneeds}`
  })
  return a;
}