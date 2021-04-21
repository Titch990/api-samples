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
const addressUidNoDDs = '0690d922-dd75-4b87-934f-1ece8968275e';                 // Previously created, will have DDs disabled
const addressUidDDs = 'ddb40c7e-e636-45e9-9fe0-dee13a3a4323';                   // Previously created, will have DDs enabled
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
let mandateUidToCancel1 =  "xxxx";
let mandateUidToCancel2 =  "xxxx";
let mandateUidToCancel3 =  "xxxx";

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

const enableMandatesForAddress = async () => {
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

const disableMandatesForAddress = async () => {
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

// Create mandate specifically so I can cancel it later

const createMandateToCancel1 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** Prep - create a new mandate to cancel later ***/';
    const data = {
          originatorServiceUserNumber: "987654",
          originatorReference: "MJ's test to cancel",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // mandateUidToCancel1 = response.data.mandateUid;; // Why doesn't this return the mandate UID as confirmation?
    mandateUidToCancel1 = newMandateUid;

};

// Create another mandate specifically so I can cancel it later

const createMandateToCancel2 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** Prep - create a new mandate to cancel later ***/';
    const data = {
          originatorServiceUserNumber: "987654",
          originatorReference: "MJ's test to cancel",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // mandateUidToCancel2 = response.data.mandateUid;; // Why doesn't this return the mandate UID as confirmation?
    mandateUidToCancel2 = newMandateUid;

};

// Create yet another mandate specifically so I can cancel it later

const createMandateToCancel3 = async () => {
    const newMandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** Prep - create a new mandate to cancel later ***/';
    const data = {
          originatorServiceUserNumber: "987654",
          originatorReference: "MJ's test to cancel",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // mandateUidToCancel3 = response.data.mandateUid;; // Why doesn't this return the mandate UID as confirmation?
    mandateUidToCancel3 = newMandateUid;

};

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
          originatorReference: "MJtestref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.1.2) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Prev 400 ****/

const putMandateValid2 = async () => {
    const date = (new Date()).toISOString();
    const newMandateUid = 'e41ddd9e-a653-428d-ac15-73676d0bc2f4';    /* Failed with 400 before */
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1.2) putMandate - PB, acc, addr, mandate valid but 400 failure ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJtestref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.1.3) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Prev 500 ****/

const putMandateValid3 = async () => {
    const date = (new Date()).toISOString();
    const newMandateUid = 'dfdfdfac-0aa7-479f-b39b-fd71c1affb65';    /* Failed with 500 before */
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1.3) putMandate - PB, acc, addr, mandate valid but 500 failure ***/';
    const data = {
          originatorServiceUserNumber: "123456",
          originatorReference: "MJtestref",
          originatorName: "MJ"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.1.4) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Saff's code ****/

const putMandateValid4 = async () => {
    const date = (new Date()).toISOString();
    const newMandateUid = v4();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1.4) putMandate - PB, acc, addr, mandate valid, Saff\'s example ***/';
    const data = {
        "originatorServiceUserNumber": "123456",
        "originatorReference": "NEW REFERENCE",
        "originatorName": "ORIGINATOR"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};


////////// Trying some  variants
// My structure, Saff's data

/* *** (F.1.5) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Saff's code ****/

const putMandateValid5 = async () => {
    const date = (new Date()).toISOString();
    const newMandateUid = v4();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1.5) putMandate - PB, acc, addr, mandate valid, Saff\'s data, my structure ***/';
    const data = {
        originatorServiceUserNumber: "123456",
        originatorReference: "NEW REFERENCE",
        originatorName: "ORIGINATOR"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

// And Saff's structure, my data

/* *** (F.1.6) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Saff's code ****/

const putMandateValid6 = async () => {
    const date = (new Date()).toISOString();
    const newMandateUid = v4();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1.6) putMandate - PB, acc, addr, mandate valid, Saff\'s structure, my data ***/';
    const data = {
        "originatorServiceUserNumber": "123456",
        "originatorReference": "MJtestref",
        "originatorName": "MJ"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (F.1.7) PUT mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Saff's code ****/

const putMandateValid7 = async () => {
    const date = (new Date()).toISOString();
    const newMandateUid = v4();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${newMandateUid}`;
    const method = 'put';
    const action = '/*** (F.1.7) putMandate - PB, acc, addr, mandate valid, Saff\'s structure, my data with spaces and apostrophes ***/';
    const data = {
        "originatorServiceUserNumber": "123456",
        "originatorReference": "MJ's test ref",
        "originatorName": "ORIGINATOR"
    };

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
    const action = '/*** (F.2.2) putMandate - PB not auth ***/';
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
    Invalid request.originatorServiceUserNumber ****/

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
    const action = '/*** (G.2.2) getMandate - PB not found ***/';

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
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidNotFound}`;
    const method = 'get';
    const action = '/*** (G.2.5) getMandate - Mandate not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.6) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Acc invalid ****/

const getMandateInvalid6 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${addressUidDDs}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.2.6) getMandate - Acc invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.7) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Addr invalid ****/

const getMandateInvalid7 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}/mandate/${mandateUid}`;
    const method = 'get';
    const action = '/*** (G.2.7) getMandate - Addr invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (G.2.8) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}: Mandate invalid ****/

const getMandateInvalid8 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidInvalid}`;
    const method = 'get';
    const action = '/*** (G.2.8) getMandate - Mandate invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/************************************************* Test H - GET mandates ********************************************/

/* *** (H.1) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: Valid ****/

const getMandatesValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate`;
    const method = 'get';
    const action = '/*** (H.1) getMandatess - PB, acc, addr, mandate valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (H.2.1) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: PB not found ****/

const getMandatesInvalid1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${addressUidDDs}/mandate`;
    const method = 'get';
    const action = '/*** (H.2.1) getMandates - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (H.2.2) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: PB not auth ****/

const getMandatesInvalid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}/address/${addressUidDDs}/mandate`;
    const method = 'get';
    const action = '/*** (H.2.2) getMandates - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (H.2.3) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: Acc not found ****/

const getMandatesInvalid3 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${addressUidDDs}/mandate`;
    const method = 'get';
    const action = '/*** (H.2.3) getMandates - Acc not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (H.2.4) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: Addr not found ****/

const getMandatesInvalid4 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/mandate`;
    const method = 'get';
    const action = '/*** (H.2.4) getMandates - Addr not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (H.2.6) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: Acc invalid ****/

const getMandatesInvalid6 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${addressUidDDs}/mandate`;
    const method = 'get';
    const action = '/*** (H.2.6) getMandates - Acc invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/* *** (H.2.7) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate: Addr invalid ****/

const getMandatesInvalid7 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}/mandate`;
    const method = 'get';
    const action = '/*** (H.2.7) getMandates - Addr invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

    // . . . and save the bit I want
    // returnedMandateUid1 = response.data.mandateUid;;
};

/************************************************* Test J - GET mandate ********************************************/

/* *** (J.1) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Valid ****/

const getMandatePaymentsValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.1) getMandatePayments - PB, acc, addr, mandate valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.1) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: PB not found ****/

const getMandatePaymentsInvalid1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.1) getMandatePayments - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.2) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: PB not auth ****/

const getMandatePaymentsInvalid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.2) getMandatePayments - PB not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.3) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Acc not found ****/

const getMandatePaymentsInvalid3 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${addressUidDDs}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.3) getMandatePayments - Acc not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.4) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Addr not found ****/

const getMandatePaymentsInvalid4 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.4) getMandatePayments - Addr not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.5) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Mandate not found ****/

const getMandatePaymentsInvalid5 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidNotFound}/payment`;
    const method = 'get';
    const action = '/*** (J.2.5) getMandatePayments - Mandate not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.6) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Acc invalid ****/

const getMandatePaymentsInvalid6 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${addressUidDDs}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.6) getMandatePayments - Acc invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.7) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Addr invalid ****/

const getMandatePaymentsInvalid7 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}/mandate/${mandateUid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.7) getMandatePayments - Addr invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/* *** (J.2.8) GET mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/payment: Mandate invalid ****/

const getMandatePaymentsInvalid8 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidInvalid}/payment`;
    const method = 'get';
    const action = '/*** (J.2.8) getMandatePayments - Mandate invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });

};

/************************************************* Test K - PUT cancel mandate ********************************************/

/* *** (K.1) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Valid ****/

const putCancelMandateValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidToCancel1}/cancel`;
    const method = 'put';
    const action = '/*** (K.1) putCancelMandate - PB, acc, addr, mandate valid ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.1) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: PB not found ****/

const putCancelMandateInvalid1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.1) putCancelMandate - PB not found ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.2) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: PB not auth ****/

const putCancelMandateInvalid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.2) putCancelMandate - PB not auth ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.3) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Acc not found ****/

const putCancelMandateInvalid3 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.3) putCancelMandate - Acc not found ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.4) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Addr not found ****/

const putCancelMandateInvalid4 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.4) putCancelMandate - Addr not found ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.5) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Mandate not found ****/

const putCancelMandateInvalid5 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidNotFound}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.5) putCancelMandate - Mandate not found ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.6) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: PB invalid ****/

const putCancelMandateInvalid6 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidInvalid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.6) putCancelMandate - PB invalid ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.7) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Acc invalid ****/

const putCancelMandateInvalid7 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.7) putCancelMandate - Acc invalid ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.8) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Addr invalid ****/

const putCancelMandateInvalid8 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.8) putCancelMandate - Addr invalid ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.2.9) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel: Mandate invalid ****/

const putCancelMandateInvalid9 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidInvalid}/cancel`;
    const method = 'put';
    const action = '/*** (K.2.9) putCancelMandate - Mandate invalid ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.3.1) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel:
    Invalid request.mandateStatusCancellationReason ****/

const putCancelMandateInvalidParam1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.3.1) putCancelMandate - Invalid request.mandateStatusCancellationReason ***/';
    const data = {
          mandateStatusCancellationReason: "NOT_A_REASON",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (K.3.2) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel:
    Missing request.mandateStatusCancellationReason ****/

const putCancelMandateInvalidParam2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidDDs}/mandate/${mandateUidToCancel2}/cancel`;
    const method = 'put';
    const action = '/*** (K.3.2) putCancelMandate - Missing request.mandateStatusCancellationReason ***/';
    const data = {
          notAMandateStatusCancellationReason: "NOTICE_DISPUTED",
    }
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.4.1) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel:
    Mandate already cancelled, same cancellation reason ****/

const putCancelMandateInvalidLogic1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNoDDs}/mandate/${mandateUidToCancel1}/cancel`;
    const method = 'put';
    const action = '/*** (K.4.1) putCancelMandate - Mandate already cancelled, same cancellation reason ***/';
    const data = {
          mandateStatusCancellationReason: "SWITCHED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (K.4.2) PUT cancel mandate /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/mandate/{mandateUid}/cancel:
    Mandate already cancelled, diff cancellation reason ****/

const putCancelMandateInvalidLogic2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNoDDs}/mandate/${mandateUidToCancel1}/cancel`;
    const method = 'put';
    const action = '/*** (K.4.2) putCancelMandate - Mandate already cancelled, diff cancellation reason ***/';
    const data = {
          mandateStatusCancellationReason: "INSTRUCTION_CANCELLED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/*************************************** Run the test methods ****************************************/

/************************************* Payment business address tests F - XXX *************************************/

enableMandatesForAddress()                                     /* Preparing data */
    .then(() => disableMandatesForAddress())
    .then(() => createMandateToCancel1())
    .then(() => createMandateToCancel2())
    .then(() => createMandateToCancel3())
    .then(() => putMandateValid())                   /***** TEST F.1 ******/      /**** PUT mandate tests ****/
    .then(() => putMandateValid2())
    .then(() => putMandateValid3())
    .then(() => putMandateValid4())                  // Trying to get mine to work like Saff's
    .then(() => putMandateValid5())
    .then(() => putMandateValid6())
    .then(() => putMandateValid7())
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
    .then(() => getMandateValid())                   /***** TEST G.1 ******/      /**** GET mandate tests ****/
    .then(() => getMandateInvalid1())
    .then(() => getMandateInvalid2())
    .then(() => getMandateInvalid3())
    .then(() => getMandateInvalid4())
    .then(() => getMandateInvalid5())
    .then(() => getMandateInvalid6())
    .then(() => getMandateInvalid7())
    .then(() => getMandateInvalid8())
    .then(() => getMandatesValid())                   /***** TEST H.1 ******/      /**** GET mandates tests ****/
    .then(() => getMandatesInvalid1())
    .then(() => getMandatesInvalid2())
    .then(() => getMandatesInvalid3())
    .then(() => getMandatesInvalid4())
    .then(() => getMandatesInvalid6())
    .then(() => getMandatesInvalid7())
    .then(() => getMandatePaymentsValid())                   /***** TEST J.1 ******/      /**** GET mandate payments tests ****/
    .then(() => getMandatePaymentsInvalid1())
    .then(() => getMandatePaymentsInvalid2())
    .then(() => getMandatePaymentsInvalid3())
    .then(() => getMandatePaymentsInvalid4())
    .then(() => getMandatePaymentsInvalid5())
    .then(() => getMandatePaymentsInvalid6())
    .then(() => getMandatePaymentsInvalid7())
    .then(() => getMandatePaymentsInvalid8())
    .then(() => putCancelMandateValid())                   /***** TEST K.1 ******/      /**** PUT cancel mandate tests ****/
    .then(() => putCancelMandateInvalid1())
    .then(() => putCancelMandateInvalid2())
    .then(() => putCancelMandateInvalid3())
    .then(() => putCancelMandateInvalid4())
    .then(() => putCancelMandateInvalid5())
    .then(() => putCancelMandateInvalid6())
    .then(() => putCancelMandateInvalid7())
    .then(() => putCancelMandateInvalid8())
    .then(() => putCancelMandateInvalid9())
    .then(() => putCancelMandateInvalidParam1())
    .then(() => putCancelMandateInvalidParam2())
    .then(() => putCancelMandateInvalidLogic1())
    .then(() => putCancelMandateInvalidLogic2())
;
