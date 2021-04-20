const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';

// Basic stuff
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';              // From MP
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';      // Made up
const paymentBusinessUidNotAuthorised = '3e2be5bc-21b8-49fe-b272-9b2eade079e9'; // Exists but not mine
const paymentBusinessUidInvalid = 'abcdefghijk';                                // Not a valid UID
const accountUid = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';                      // Created in MP
const accountUid2 = 'f44ec61b-51b7-49eb-9149-4a2b1e3b34ea';                     // Created in a previous run of this code
const accountUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bdccc';              // Made up
const accountUidNotAuthorised = '148d1a4d-cf8d-4923-9be0-c8fe29a5dea9';         // Exists but not mine
const accountUidInvalid = 'abcdefghijk';                                        // Not a valid UID
const addressUidNoDDs = '0690d922-dd75-4b87-934f-1ece8968275e';                 // Created by running some code like this
const addressUidDDs = 'ddb40c7e-e636-45e9-9fe0-dee13a3a4323';                   // Created by running some code like this, then enabling DDs
const addressUidNotFound = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffd';              // Made up
const addressUidNotAuthorised = '3f957fd9-ed3d-486d-9572-6be69bfd6263';         // Exists but not mine
const addressUidInvalid = 'abcdefghijk';                                        // Not a valid UID
const sortCode = '040059';

// Mandates
const mandateUid = '6b1026b9-785b-4be2-8620-f1105bae58e9';                       // Created in a previous run of this code
const mandateUidNotFound = '09dbbfac-50b1-47f3-ac7b-a37d828bdccc';               // Made up
const mandateUidInvalid = 'abcdefgh';                                            // Not a valid UID


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
 * This batch of tests cover the F to N (Mandates) tests in my 'Payment Services API errors'
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

/************************************************* Some test prep ********************************************/

// Set some specific attributes

// Mandates enabled for addressUidDDs

const enableMandates = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** Prep - enable mandates for an address ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
          directDebitPaymentsStatus: "ENABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

// Mandates disabled for addressUidNoDDs

const disableMandates = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNoDDs}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** Prep - disable mandates for an address ***/';
    const data = {
          directCreditPaymentsStatus: "DISABLED",
          directDebitPaymentsStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

}

/************************************************* Test F - PUT mandate ********************************************/

/* *** (F.1) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Valid ****/

const putMandateValid = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1) putMandate - PB, acc, addr, mandate valid ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.2.1) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: PB not found ****/

const putMandateInvalid1 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.2.1) putMandate - PB not found ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.2.2) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: PB not auth ****/

const putMandateInvalid2 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.2.1) putMandate - PB not auth ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.2.3) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Acc not found ****/

const putMandateInvalid3 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.2.3) putMandate - Acc not found ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.2.4) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Addr not found ****/

const putMandateInvalid4 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.2.4) putMandate - Addr not found ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.3.1) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Invalid request.originatorServiceUserNumber1 ****/

const putMandateInvalidParam1 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.3.1) putMandate - Invalid request.originatorServiceUserNumber1 ***/';
    const data = {
          originatorServiceUserNumber: "1234567",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.3.2) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Invalid request.originatorServiceUserNumber2 ****/

const putMandateInvalidParam2 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.3.2) putMandate - Invalid request.originatorServiceUserNumber2 ***/';
    const data = {
          originatorServiceUserNumber: "12345",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.3.3) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Invalid request.originatorReference ****/

const putMandateInvalidParam3 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.3.3) putMandate - Invalid request.originatorReference ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's very, very, very, very long test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.3.4) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Missing request.originatorServiceUserNumber ****/

const putMandateInvalidParam4 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.3.4) putMandate - Missing request.originatorServiceUserNumber ***/';
    const data = {
        originatorReference: "MJ's test ref",
        originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.3.5) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Missing request.originatorReference ****/

const putMandateInvalidParam5 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.3.3) putMandate - Missing request.originatorReference ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.3.6) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Missing request.originatorName ****/

const putMandateInvalidParam6 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.3.5) putMandate - Missing request.originatorName ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.4.1) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}:
    Address not enabled for mandates ****/

const putMandateInvalidNoDDs = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNoDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.4.1) putMandate - Address not enabled for mandates ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJ's test ref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/************************************************* Test G - GET mandate ********************************************/

/* *** (G.1) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Valid ****/

const getMandateValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.1) getMandate - PB, acc, addr, mandate valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.1) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: PB not found ****/

const getMandateInvalid1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.2.1) getMandate - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.2) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: PB not auth ****/

const getMandateInvalid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.2.1) getMandate - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.3) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Acc not found ****/

const getMandateInvalid3 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${addressUidDDs}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.2.3) getMandate - Acc not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.4) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Addr not found ****/

const getMandateInvalid4 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.2.4) getMandate - Addr not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.5) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Mandate not found ****/

const getMandateInvalid5 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/mandate/${mandateUidNotFound}`;
    const method = 'get';
    const action = '/*** (G.2.4) getMandate - Mandate not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};













/*************************************** Run the test methods ****************************************/

/************************************* Payment business address tests F - XXX *************************************/

enableMandates()                                     // Preparing data
    .then(() => disableMandates())                   // Preparing data
    .then(() => putMandateValid())                   /***** TEST F.1 ******/      /**** PUT tests ****/
    .then(() => putMandateInvalid1())
    .then(() => putMandateInvalid2())
    .then(() => putMandateInvalid3())
    .then(() => putMandateInvalid4())
    .then(() => putMandateInvalidParam1())
    .then(() => putMandateInvalidParam2())
    .then(() => putMandateInvalidParam3())
    .then(() => putMandateInvalidParam4())
    .then(() => putMandateInvalidParam5())
    .then(() => putMandateInvalidParam6())
    .then(() => putMandateInvalidNoDDs())
    .then(() => getMandateValid())                   /***** TEST G.1 ******/      /**** GET tests ****/
    .then(() => getMandateInvalid1())
    .then(() => getMandateInvalid2())
    .then(() => getMandateInvalid3())
    .then(() => getMandateInvalid4())
    .then(() => getMandateInvalid5())

;
