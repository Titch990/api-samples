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
const addressUidInvalid = 'abcdefghijk';                                        // Not a valid UID
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

/************************************************* PB account FPS status ********************************************/

/* *** (D.1.1) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: PB, acc, address valid ****/

const putFPSValid1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.1) PUT FPS status - PB, acc, addr valid ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "ENABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.1.2) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: PB, acc, address valid ****/

const putFPSValid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.1) PUT FPS status - PB, acc, addr valid ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.2) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/faster-payments-status: PB, acc, addr exist, not authorised ****/

const putFPSNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUidNotAuthorised}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.2) PUT FPS status - PB, acc, addr exist, not auth ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);
    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.3) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: PB, acc valid, addr not found ****/

const putFPSAddrNotFound = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.3) PUT FPS status - PB, acc valid, addr not found ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.4) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: inboundStatus missing ***/

const putFPSInboundMissing = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${newAddressUid}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.4) PUT FPS status - inboundStatus missing ***/';
    const data = {
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.5) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: ioutboundStatus missing ***/

const putFPSOutboundMissing = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.5) PUT FPS status - outboundStatus missing ***/';
    const data = {
          inboundStatus: "ENABLED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.6) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: inboundStatus invalid ****/

const putFPSInboundInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.6) PUT FPS status - inboundStatus invalid ***/';
    const data = {
          inboundStatus: "ENABLEDXXXX",
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.7) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: outbpundStatus invalid ****/

const putFPSOutboundInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUid}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.7) PUT FPS status - outboundStatus invalid ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "DISABLEDXXXX"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};









/* *** (D.8) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: add UID not valid ****/

const putAddressInvalidUid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}`;
    const method = 'put';
    const action = '/*** (D.8) putAddress - add UID not valid ***/';
    const data = {
          accountName: "My Account Name",
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.9) PUT PB addresss /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountName invalid ****/

const putAddressInvalidRequestData1 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.9) putAddress - request.accountName invalid ***/';
    const data = {
        accountName: "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid" +
            "this is an incredibly long account name so I hope it's going to be invalid",
        sortCode: sortCode,
        accountNumber: "12345679"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.10) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.sortCode invalid ****/

const putAddressInvalidRequestData2 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.10) putAddress - request.sortCode invalid ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: "999999",
        accountNumber: "12345679"
    }

    // Get the Signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Make the call, and grab the response (note the "async" needed in the declaration above, because of the "await" here)
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // Now you can do something with the response, like save it, if you want to

};

/* *** (D.11) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountNumber invalid ****/

const putAddressInvalidRequestData3 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.11) putAddress - request.accountNumber invalid ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode,
        accountNumber: "12345679123456789"
    }

    // Get the Signature
    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Make the call, and grab the response (note the "async" needed in the declaration above, because of the "await" here)
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // Now you can do something with the response, like save it, if you want to

};

/* *** (D.12) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountName missing ****/

const putAddressInvalidRequestData4 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.12) putAddress - request.accountName missing ***/';
    const data = {
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.13) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.sortCode missing ****/

const putAddressInvalidRequestData5 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.13) putAddress - request.sortCode missing ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};


/* *** (D.14) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountNumber missing ****/

const putAddressInvalidRequestData6 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.14) putAddress - request.accountNumber missing ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.15) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountNumber supplied ****/

const putAddressInvalidRequestData7 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (D.15) putAddress - request.accountNumber non-blank ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.16) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Valid ****/

const getAddressValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'get';
    const action = '/*** (D.16) getAddress - PB, address valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.17) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Not authorised ****/

const getAddressNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUidNotAuthorised}`;
    const method = 'get';
    const action = '/*** (D.17) getAddress - PB, address not authorised ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.18) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: not found ****/

const getAddressAccNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}`;
    const method = 'get';
    const action = '/*** (D.18) getAddress - PB, address not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.19) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: invalid ****/

const getAddressAccInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}`;
    const method = 'get';
    const action = '/*** (D.19) getAddress - PB, address invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.20) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: Valid ****/

const getAddressesValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address`;
    const method = 'get';
    const action = '/*** (D.20) getAddresses - PB, account valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.21) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: Not authorised ****/

const getAddressesNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address`;
    const method = 'get';
    const action = '/*** (D.21) getAddresses - PB, account not authorised ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.22) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: not found ****/

const getAddressesAccNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address`;
    const method = 'get';
    const action = '/*** (D.22) getAddresses - PB valid, account not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (D.23) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: invalid ****/

const getAddressesAccInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address`;
    const method = 'get';
    const action = '/*** (D.23) getAddresses - PB valid, account invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/*************************************** Run the test methods ****************************************/

/************************************* Payment business address tests C *************************************/

putFPSValid2()                                     /***** TEST D.1.1 ******/      /**** PUT FPS tests ****/
    .then(() => putFPSValid2())                    /***** TEST D.1.2 ******/
    .then(() => putFPSNotAuthorised())             /***** TEST D.2 ******/
    .then(() => putFPSAddrNotFound())              /***** TEST D.3 ******/
    .then(() => putFPSInboundMissing())            /***** TEST D.4 ******/
    .then(() => putFPSOutboundMissing())           /***** TEST D.5 ******/
    .then(() => putFPSInboundInvalid())            /***** TEST D.6 ******/
    .then(() => putFPSOutboundInvalid())           /***** TEST D.7 ******/
