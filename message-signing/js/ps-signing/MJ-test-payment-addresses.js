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

/************************************************* PB account addresses ********************************************/

/* *** (C.1) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Valid ****/

const putAddressValid = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.1) putAddress - PB, acc valid ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

    // . . . and save the bit I want
    returnedAddressUid1 = response.data.addressUid;;
};

/* *** (C.2) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}: PB, acc exist, not authorised ****/

const putAddressNotAuthorised = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.2) putAddress - PB and acc exist, not auth ***/';
    const data = {
              accountName: "Millie Moodle (one of many)",
              sortCode: sortCode,
              accountNumber: "12345679"
        }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);
    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (C.3) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB valid, acc not found ****/

const putAddressAccNotFound = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.3) putAddress - PB valid, acc not found ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.4) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB valid, acc invalid ***/

const putAddressAccInvalid = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.4) putAddress - PB valid, acc invalid ***/';
    const data = {
        accountName: "Millie Moodle (one of many)",
        sortCode: sortCode,
        accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.5) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: add already exists, same details ***/

const putAddressExistsSame = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const action = '/*** (C.5) putAddress - add exists, same details ***/';
    const data = {
        accountName: "My Account Name",
        sortCode: sortCode,
        accountNumber: "48663475"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.6.1) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: acc exists, accountNumber different ****/

const putAddressExistsDifferent1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const action = '/*** (C.6.1) putAddress - add exists, accountNumber different ***/';
    const data = {
          accountName: "My Account Name",
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.6.2) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: acc exists, accountNumber not supplied ****/

const putAddressExistsDifferent2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const action = '/*** (C.6.2) putAddress - add exists, accountNumber not supplied ***/';
    const data = {
          accountName: "My Account Name",
          sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.6.3) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: acc exists, accountName different ****/

const putAddressExistsDifferent3 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const action = '/*** (C.6.3) putAddress - add exists, accountName different ***/';
    const data = {
          accountName: "New Account Name",
          sortCode: sortCode,
          accountNumber: "48663475"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.7) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: PB, account, add exist, not auth ****/

const putAddressNotAuth = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUid}`;
    const method = 'put';
    const action = '/*** (C.7) putAddress - PB, account exist, not auth ***/';
    const data = {
          accountName: "My Account Name",
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.8) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: add UID not valid ****/

const putAddressInvalidUid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}`;
    const method = 'put';
    const action = '/*** (C.8) putAddress - add UID not valid ***/';
    const data = {
          accountName: "My Account Name",
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.9) PUT PB addresss /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountName invalid ****/

const putAddressInvalidRequestData1 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.9) putAddress - request.accountName invalid ***/';
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

/* *** (C.10) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.sortCode invalid ****/

const putAddressInvalidRequestData2 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.10) putAddress - request.sortCode invalid ***/';
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

/* *** (C.11) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountNumber invalid ****/

const putAddressInvalidRequestData3 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.11) putAddress - request.accountNumber invalid ***/';
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

/* *** (C.12) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountName missing ****/

const putAddressInvalidRequestData4 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.12) putAddress - request.accountName missing ***/';
    const data = {
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.13) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.sortCode missing ****/

const putAddressInvalidRequestData5 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.13) putAddress - request.sortCode missing ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};


/* *** (C.14) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountNumber missing ****/

const putAddressInvalidRequestData6 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.14) putAddress - request.accountNumber missing ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          sortCode: sortCode
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.15) PUT PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: request.accountNumber supplied ****/

const putAddressInvalidRequestData7 = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${newAddressUid}`;
    const method = 'put';
    const action = '/*** (C.15) putAddress - request.accountNumber non-blank ***/';
    const data = {
          accountName: "Millie Moodle (one of many)",
          sortCode: sortCode,
          accountNumber: "12345678"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (C.16) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Valid ****/

const getAddressValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'get';
    const action = '/*** (C.16) getAddress - PB, address valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.17) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: Not authorised ****/

const getAddressNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUidNotAuthorised}`;
    const method = 'get';
    const action = '/*** (C.17) getAddress - PB, address not authorised ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.18) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: not found ****/

const getAddressAccNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}`;
    const method = 'get';
    const action = '/*** (C.18) getAddress - PB, address not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.19) GET PB address /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}: invalid ****/

const getAddressAccInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidInvalid}`;
    const method = 'get';
    const action = '/*** (C.19) getAddress - PB, address invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.20) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: Valid ****/

const getAddressesValid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address`;
    const method = 'get';
    const action = '/*** (C.20) getAddresses - PB, account valid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.20.2) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: Valid ****/

const getAddressesValid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address?page=2`;
    const method = 'get';
    const action = '/*** (C.20.2) getAddresses - PB, account valid, page 2 ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.21) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: Not authorised ****/

const getAddressesNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address`;
    const method = 'get';
    const action = '/*** (C.21) getAddresses - PB, account not authorised ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.22) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: not found ****/

const getAddressesAccNotFound = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidNotFound}/address`;
    const method = 'get';
    const action = '/*** (C.22) getAddresses - PB valid, account not found ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/* *** (C.23) GET PB addresses /api/v1/{paymentBusinessUid}/account/{accountUid}/address: invalid ****/

const getAddressesAccInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address`;
    const method = 'get';
    const action = '/*** (C.23) getAddresses - PB valid, account invalid ***/';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest });
};

/*************************************** Run the test methods ****************************************/

/************************************* Payment business address tests C *************************************/

putAddressValid()                                     /***** TEST C.1 ******/      /**** PUT tests ****/
    .then(() => {
        // Checking I've saved the values I expected to save
        console.log("Returned addressUid: " + returnedAddressUid1)
    })
    .then(() => putAddressNotAuthorised())            /***** TEST C.2 ******/
    .then(() => putAddressAccNotFound())              /***** TEST C.3 ******/
    .then(() => putAddressAccInvalid())               /***** TEST C.4 ******/
    .then(() => putAddressExistsSame())               /***** TEST C.5 ******/
    .then(() => putAddressExistsDifferent1())         /***** TEST C.6.1 ******/
    .then(() => putAddressExistsDifferent2())         /***** TEST C.6.2 ******/
    .then(() => putAddressExistsDifferent3())         /***** TEST C.6.3 ******/
    .then(() => putAddressNotAuth())                  /***** TEST C.7 ******/
    .then(() => putAddressInvalidUid())               /***** TEST C.8 ******/
    .then(() => putAddressInvalidRequestData1())      /***** TEST C.9 ******/
    .then(() => putAddressInvalidRequestData2())      /***** TEST C.10 ******/
    .then(() => putAddressInvalidRequestData3())      /***** TEST C.11 *****/
    .then(() => putAddressInvalidRequestData4())      /***** TEST C.12 *****/
    .then(() => putAddressInvalidRequestData5())      /***** TEST C.13 *****/
    .then(() => putAddressInvalidRequestData6())      /***** TEST C.14 *****/
    .then(() => putAddressInvalidRequestData7())      /***** TEST C.15 *****/
    .then(() => getAddressValid())                    /***** TEST C.16 *****/       /**** GET tests ****/
    .then(() => getAddressNotAuthorised())            /***** TEST C.17 ******/
    .then(() => getAddressAccNotFound())              /***** TEST C.18 ******/
    .then(() => getAddressAccInvalid())               /***** TEST C.19 ******/
    .then(() => getAddressesValid())                  /***** TEST C.20 *****/       /**** GET addresses tests ****/
    .then(() => getAddressesValid2())                 /***** TEST C.20.2 *****/
    .then(() => getAddressesNotAuthorised())          /***** TEST C.21 ******/
    .then(() => getAddressesAccNotFound())            /***** TEST C.22 ******/
    .then(() => getAddressesAccInvalid());            /***** TEST C.21 ******/
