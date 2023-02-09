import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';
import { payload,params } from './ApiCallsData.js';
import { payLoadForUser } from './ApiCallsData.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/2.2.0/dist/bundle.js";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';


import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';


const csvData = new SharedArray('another data name', function () {
    // Load CSV file and parse it using Papa Parse
    return papaparse.parse(open('./payLoadData.csv'), { header: true }).data;
  });


export let options = {
    thresholds:{
        http_reqs:['count>=0']
    },
    scenarios: {
      firstWave: {
        executor: 'constant-vus',
        vus: 10,
        duration: '30s',
        startTime: '0s'    
      },
      secondWave: {
        executor: 'constant-vus',
        vus: 15,
        duration: '30s',
        startTime: '30s'    
      },
      thirdWave: {
        executor: 'constant-vus',
        vus: 20,
        duration: '30s',
        startTime: '1m'    
      },
    },
}

export default function () {
     console.log('CSV Data Length is:',csvData.length)
     let r = http.post('https://restful-booker.herokuapp.com/auth',payload,params);
     sleep(1);
     check(r, {
        'is status 200': (r) => r.status === 200,
      });   
      check(r,{
        'is token available': (r)=>r.json().token!='undefined',
      })
     console.log(r.json().token);
    let updateBookingParams = {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Cookie': `token=${r.json().token}`
        },
      };
     let deleteBookingParams = {headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${r.json().token}`
      },}
      let bookingIDs = [];
      for (let i=0 ;i<csvData.length; i++){
        let createBooking = http.post('https://restful-booker.herokuapp.com/booking',payLoadForUser(i),params);
        check(createBooking,{
          'has booking been created successfully':(r) => r.status === 200
       });
        console.log('New booking body is:', createBooking.json());
        console.log('New booking id is',createBooking.json().bookingid);
        let bookingID = createBooking.json().bookingid;
        bookingIDs.push(bookingID);   
      }
    for(let i=0; i<csvData.length; i++ ){
        let updateBooking = http.patch(`https://restful-booker.herokuapp.com/booking/${bookingIDs[i]}`,payLoadForUser(csvData.length-i-1),updateBookingParams);
        check(updateBooking,{
          'has booking been updated successfully':(r) => r.status === 200
       });

        console.log('Update booking',updateBooking.status);   
    }
     for(let i=0; i<csvData.length; i++){
        let deleteBooking = http.del(`https://restful-booker.herokuapp.com/booking/${bookingIDs[i]}`,null,deleteBookingParams);
        check(deleteBooking,{
            'has booking been deleted successfully':(r) => r.status === 201
         });
         console.log('Booking deletion status',deleteBooking.status);
     }
  }
  
  export function handleSummary(data) {
  return {
    "summary2.html": htmlReport(data),
    stdout: textSummary(data, { indent: '→', enableColors: true }),
  };
}