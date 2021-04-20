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
const accountUid2 = 'f44ec61b-51b7-49eb-9149-4a2b1e3b34ea';                     // Created in a previous run of this code
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

/*
 *
 * This batch of tests cover the A and B tests in my 'Payment Services API errors - PBS, accounts and addresses'
 * document
 *
 */

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

/* ********************** (A.1) GET payment business details /api/v1/{paymentBusinessUid}: Valid ******************* */

const getPaymentBusinessValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}`;
    const method = 'get';
    const action = '/*** (A.1) getPB - PB valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call, and grab the response (note the "async" needed in the declaration above, because of the "await" here)
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // Now I can save the bit I want. In this case, I already know this so it should be the same.
    returnedPaymentBusinessUid = response.data.paymentBusinessUid;
};

/* ********************* (A.2) GET payment business details /api/v1/{paymentBusinessUid}: Not authorised *********** */

const getPaymentBusinessNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}`;
    const method = 'get';
    const action = '/*** (A.2) getPB - PB not auth ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* ********************* (A.3) GET payment business details /api/v1/{paymentBusinessUid}: Not found *******************/

const getPaymentBusinessNotFound= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}`;
    const method = 'get';
    const action = '/*** (A.3) getPB - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/* ********************* (A.4) GET payment business details /api/v1/{paymentBusinessUid}:Invalid *******************/

const getPaymentBusinessInvalid= () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}`;
    const method = 'get';
    const action = '/*** (A.4) getPB - PB invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ action, url, method, authorization, date, digest });
};

/******************************************************* PB accounts **********************************************/

/* ************** (B.1) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: Valid *********************/

const putAccountValid = async () => {
    const newAccountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${newAccountUid}`;
    const method = 'put';
    const action = '/*** (B.1) putAccount - PB valid ***/';
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

/* ********** (B.2) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not authorised *********/

const putAccountPBNotAuthorised = async () => {
    const newAccountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${newAccountUid}`;
    const method = 'put';
    const action = '/*** (B.2) putAccount - PB exists, not auth ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);
    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (B.3) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB not found ***********/

const putAccountPBNotFound = async () => {
    const newAccountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${newAccountUid}`;
    const method = 'put';
    const action = '/*** (B.3) putAccount - PB not found ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (B.4) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account already exists, same details ***********/

const putAccountExistsSame = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** (B.4) putAccount - acc exists, same details ***/';
    const data = {
          description: "Account 1",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (B.5) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account exists, details different ***********/

const putAccountExistsDifferent = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid2}`;
    const method = 'put';
    const action = '/*** (B.5) putAccount - acc exists, , details different ***/';
    const data = {
          description: "Some random stuff" + Math.random(),
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********** (B.6) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: PB, account exist, not auth ***********/

const putAccountNotAuth = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}`;
    const method = 'put';
    const action = '/*** (B.6) putAccount - PB, account exist, not auth ***/';
    const data = {
          description: "Some random stuff" + Math.random(),
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* ********* (B.7) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: account UID not valid ***********/

const putAccountInvalidUID = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}`;
    const method = 'put';
    const action = '/*** (B.7) putAccount - account UID not valid ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "AGENCY"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *********** (B.8) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: request.accountHolder invalid ***********/

const putAccountInvalidRequestData1 = async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** (B.8) putAccount - request.accountHolder invalid ***/';
    const data = {
          description: "MJ's test account (one of many)",
          accountHolder: "FRED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* ************* (B.9) PUT PB account /api/v1/{paymentBusinessUid}/account/{accountUid}: request.description missing ***********/

const putAccountInvalidRequestData2= async () => {
    const accountUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'put';
    const action = '/*** (B.9) putAccount - request.description missing ***/';
    const data = {
          accountHolder: "AGENCY"
    }

    // Get the Signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Make the call, and grab the response (note the "async" needed in the declaration above, because of the "await" here)
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // Now you can do something with the response, like save it, if you want to

};

/* *************** (B.10) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: Valid ***********/

const getAccountValid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';
    const action = '/*** (B.10) getAccount - Valid ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.11) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: PB, acc exist, not authorised ***********/

const getAccountNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}`;
    const method = 'get';
    const action = '/*** (B.11) getAccount - PB, acc exist, not authorised ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.12) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: PB exists, acc not found ***********/

const getAccountNotFound = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}`;
    const method = 'get';
    const action = '/*** (B.12) getAccount - PB exists, acc not found ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.13) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: accountUid invalid ***********/

const getAccountInvalid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}`;
    const method = 'get';
    const action = '/*** (B.13) getAccount - accountUid invalid ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.14) GET PB account details /api/v1/{paymentBusinessUid}/account: valid ***********/

const getAccountsValid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account`;
    const method = 'get';
    const action = '/*** (B.14) getAccounts - valid ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.15) GET PB account details /api/v1/{paymentBusinessUid}/account/{accountUid}: paymentBusinessUid not authorised ***********/

const getAccountsNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account`;
    const method = 'get';
    const action = '/*** (B.15) getAccounts - paymentBusinessUid not authorised ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.16) GET PB account details /api/v1/{paymentBusinessUid}/account: paymentBusinessUid not found ***********/

const getAccountsNotFound = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account`;
    const method = 'get';
    const action = '/*** (B.16) getAccounts - paymentBusinessUid not found ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/* *************** (B.17) GET PB account details /api/v1/{paymentBusinessUid}/account: paymentBusinessUid invalid ***********/

const getAccountsInvalid = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}/account`;
    const method = 'get';
    const action = '/*** (B.17) getAccounts - paymentBusinessUid invalid ***/';

    // Get the signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Make the call - use this format if you don't need to do anything with the response here
    return makeRequest({ action, url, method, authorization, date, digest });
};

/*************************************** Run the test methods ****************************************/

getPaymentBusinessValid()                              /***** TEST A.1 ******/   /**** GET PB tests ****/
    .then(() => {
        // Checking I've saved the values I expected to save
        console.log("Returned paymentBusinessUid: " + returnedPaymentBusinessUid)
    })
    .then(() => getPaymentBusinessNotAuthorised())     /***** TEST A.2 ******/
    .then(() => getPaymentBusinessNotFound())          /***** TEST A.3 ******/
    .then(() => getPaymentBusinessInvalid())

    .then(() => putAccountValid())                     /***** TEST B.1 ******/      /**** PUT account tests ****/
    .then(() => {
        // Checking I've saved the values I expected to save
        console.log("Returned accountUid: " + returnedAccountUid1)
    })
    .then(() => putAccountPBNotAuthorised())          /***** TEST B.2 ******/
    .then(() => putAccountPBNotFound())               /***** TEST B.3 ******/
    .then(() => putAccountExistsSame())               /***** TEST B.4 ******/
    .then(() => putAccountExistsDifferent())          /***** TEST B.5 ******/
    .then(() => putAccountNotAuth())                  /***** TEST B.6 ******/
    .then(() => putAccountInvalidUID())               /***** TEST B.7 ******/
    .then(() => putAccountInvalidRequestData1())      /***** TEST B.8 ******/
    .then(() => putAccountInvalidRequestData2())      /***** TEST B.9 ******/
    .then(() => getAccountValid())                    /***** TEST B.10 *****/      /**** GET account tests ****/
    .then(() => getAccountNotAuthorised())            /***** TEST B.11 *****/
    .then(() => getAccountNotFound())                 /***** TEST B.12 *****/
    .then(() => getAccountInvalid())                  /***** TEST B.13 *****/
    .then(() => getAccountsValid())                   /***** TEST B.14 *****/     /**** GET accounts tests ****/
    .then(() => getAccountsNotAuthorised())           /***** TEST B.15 *****/
    .then(() => getAccountsNotFound())                /***** TEST B.16 *****/
    .then(() => getAccountsInvalid());                /***** TEST B.17 *****/
