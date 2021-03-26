const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';              // From MP
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';      // Made up
const paymentBusinessUidNotAuthorised = '3e2be5bc-21b8-49fe-b272-9b2eade079e9'; // Exists but not mine
const paymentBusinessUidInvalid = 'abcdefghijk';                                // Not a valid UID
const accountUid = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';                      // Created in MP
const accountUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bdccc';              // Made up
const accountUidNotAuthorised = '148d1a4d-cf8d-4923-9be0-c8fe29a5dea9';         // Exists but not mine
const accountUidInvalid = 'abcdefghijk';                                        // Not a valid UID
const addressUid = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffc';                      // Created by running some code like this
const addressUidNotFound = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffd';              // Made up
const addressUidNotAuthorised = '3f957fd9-ed3d-486d-9572-6be69bfd6263';         // Exists but not mine
const accressUidInvalid = 'abcdefghijk';                                        // Not a valid UID
const sortCode = '040059';

// Some of the things we'll get back at run time
let returnedPaymentBusinessUid = "xxxx";
let returnedPaymentBusinessSuccess = "yyyy";
let returnedAccountUid1 = "xxxx";
let returnedAccountUid2 = "xxxx";
let returnedAccountStatus = "yyyy";
let returnedAccount2Uid = "xxxx";
let returnedAddress1Uid =  "xxxx";
let returnedAddress2Uid =  "xxxx";
let returnedAddress3Uid =  "xxxx";
let returnedAddress4Uid =  "xxxx";

/************************************************ Do the signing *****************************************/

const calculateAuthorisationAndDigest = (date, method, url, data = '') => {
    const digest = data === ''
        ? ''
        : crypto
            .createHash('sha512')
            .update(JSON.stringify(data))
            .digest('base64');

    const signature = crypto
        .createSign('RSA-SHA512')
        .update(`(request-target): ${method} ${url}\nDate: ${date}\nDigest: ${digest}`)
        .sign(fs.readFileSync(privateKeyPath), 'base64');

    return {
        digest,
        authorization: `Signature keyid="${apiKeyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`
    };
};

/************************************************ Make the call *****************************************/

const makeRequest = ({ action, url, method, authorization, date, digest, data = '' }) => axios.request({
    baseURL,
    url,
    method,
    data,
    headers: {
        Authorization: authorization,
        Date: date,
        Digest: digest,
        'Content-Type': 'application/json',
        'User-Agent': 'api-samples/message-signing/js/ps-signing'
    }
})
    .then(response => {
        console.log("\n" + action)
        console.log(url)
        console.log("SUCCESS")
        console.log("HTTP status: " + response.status)
        console.log("Response data:\n", response.data)
        // Return response to caller
        return response
    })
    .catch(err => {
        console.log("\n" + action)
        console.log(url)
        console.log("ERROR")
        console.error("HTTP status: " + err.response.status)
        console.error("Response data:\n", err.response.data)
    });

/*******************************************************************************************************************/
/*********************************************** Test methods ******************************************************/
/*******************************************************************************************************************/

/************************************************* Payment businesses **********************************************/

/* ********************** (1) GET payment business details /api/v1/{paymentBusinessUid}: Valid ******************* */

const getPaymentBusinessValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}`;
    const method = 'get';
    const action = '/*** (1) PB valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call, and grab the response (note the "async" needed in the declaration above, because of the "await" here)
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // Now I can save the bit I want. In this case, I already know this so it should be the same.
    returnedPaymentBusinessUid = response.data.paymentBusinessUid;
};

/* ********************* (2) GET payment business details /api/v1/{paymentBusinessUid}: Not authorised *********** */

const getPaymentBusinessNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}`;
    const method = 'get';
    const action = '/*** (2) PB not auth ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* ********************* (3) GET payment business details /api/v1/{paymentBusinessUid}: Not found *******************/

const getPaymentBusinessNotFound= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}`;
    const method = 'get';
    const action = '/*** (3) PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* ********************* (4) GET payment business details /api/v1/{paymentBusinessUid}:Invalid *******************/

const getPaymentBusinessInvalid= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}`;
    const method = 'get';
    const action = '/*** (4) PB invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/******************************************************* PB accounts **********************************************/

/* ************** (4) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: Valid *********************/

const putAccountValid = async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** putAccount - VALID ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    returnedAccountUid1 = response.data.paymentAccountUid;;
};

/* ********** (5) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not authorised *********/

const putAccountPBNotAuthorised = async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** putAccount - PB NOT AUTHORISED ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);
    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (6) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not found ***********/

const putAccountPBNotFound = async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** putAccount - PB NOT FOUND ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (7) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account exists ***********/

/* ********** (8) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account exists, details different ***********/

/* ********** (9) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account exists, not authorised ***********/

/* ********* (10) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account not found ***********/

const putAccountInvalidUID = async () => {
    const accountUid = 'xxx';
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** putAccount - ACCOUNT UID INVALID ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *********** (11) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: request.accountHolder invalid ***********/

const putAccountInvalidRequestData1 = async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** putAccount - REQUEST DATA INVALID 1 ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "FRED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* ************* (12) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: request.description missing ***********/

const putAccountInvalidRequestData2= async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** putAccount - REQUEST DATA INVALID 2 ***/';
    const data = {
          accountHolder: "FRED"
    }

    // Get the Signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Make the call, and grab the response (note the "async" needed in the declaration above, because of the "await" here)
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // Now you can do something with the response, like save it, if you want to

};

/* *************** (13) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: Valid ***********/

/* *************** (14) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not authorised ***********/

/* *************** (15) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not found ***********/

/* *************** (16) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: accountUid not authorised ***********/

/* *************** (17) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: accountUid not found ***********/

/* *************** (18) GET PB accounts /api/v1/{paymentBusinessUid}/account - Valid */

const getAccount = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';
    const action = '/*** getAccount - VALID ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* **************** (19) GET PB accounts /api/v1/{paymentBusinessUid}/account - PB Unauthorisesd ***********/

/* **************** (20) GET PB accounts /api/v1/{paymentBusinessUid}/account - PB invalid ***********/




/* PUT PB address - Valid */
const putAddress = () => {
    const addressUid = v4(); // I think this makes a new addressUid??
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const data = {
        accountName: 'My Account Name',
        sortCode
    };
    const action = '/*** putAddress - VALID ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, data, authorization, date, digest });
};

/************************************ Run the test methods *************************************/

/************************************* Payment business tests *************************************/

getPaymentBusinessValid()
    .then(() => {
        // Checking I've saved the values I expected to save
        console.log("Returned paymentBusinessUid: " + returnedPaymentBusinessUid)
    })
    .then(() => getPaymentBusinessNotAuthorised())
    .then(() => getPaymentBusinessNotFound())
    .then(() => getPaymentBusinessInvalid());

/************************************* Payment account PUT tests *************************************/

putAccountValid()
    .then(() => {
        // Checking I've saved the values I expected to save
        console.log("Returned accountUid: " + returnedAccountUid1)
    })
    .then(() => putAccountPBNotAuthorised())
    .then(() => putAccountPBNotFound())
    .then(() => putAccountInvalidUID())
    .then(() => putAccountInvalidRequestData1())
    .then(() => putAccountInvalidRequestData1());

/************************************* Payment account GET tests *************************************/



/*
getAccount()
    .then(() => getAccountError()
        .then(() => getAccountNotAuthorised()));


*/
        getAccount()
            .then(() => putAddress());
