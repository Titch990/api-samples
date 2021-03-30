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
const addressUid = 'ddb40c7e-e636-45e9-9fe0-dee13a3a4323';                      // Created by running some code like this
const addressUidClosed = 'e2ea3b6f-b6a9-4c4b-8732-d3ca6d4e6ffc';                // Created by running some code like this (and then closing!)
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
    const action = '/*** (D.1.1) PUT FPS status - PB, acc, addr valid ***/';
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
    const action = '/*** (D.1.2) PUT FPS status - PB, acc, addr valid ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.1.3) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: address closed ****/

const putFPSAddressClosed = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidClosed}/faster-payments-status`;
    const method = 'put';
    const action = '/*** (D.1.3) PUT FPS status - address closed ***/';
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

/* *** (D.7) PUT FPS status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/faster-payments-status: outboundStatus invalid ****/

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

/************************************************* PB account Bacs status ********************************************/

/* *** (D.8.1) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: PB, acc, address valid ****/

const putBacsValid1 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.8.1) PUT Bacs status - PB, acc, addr valid ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
          directDebitPaymentsStatus: "ENABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.8.2) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: PB, acc, address valid ****/

const putBacsValid2 = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.8.2) PUT Bacs status - PB, acc, addr valid ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
          directDebitPaymentsStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.8.3) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-status: address closed ****/

const putBacsAddressClosed = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidClosed}/bacs-status`;
    const method = 'put';
    const action = '/*** (D.8.3) PUT Bacs status - address closed ***/';
    const data = {
          inboundStatus: "ENABLED",
          outboundStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.9) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/bacs-payments-status: PB, acc, addr exist, not authorised ****/

const putBacsNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUidNotAuthorised}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.9) PUT Bacs status - PB, acc, addr exist, not auth ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
          directDebitPaymentsStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);
    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.10) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: PB, acc valid, addr not found ****/

const putBacsAddrNotFound = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.10) PUT Bacs status - PB, acc valid, addr not found ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
          directDebitPaymentsStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.11) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: directCreditPaymentsStatus missing ***/

const putBacsInboundMissing = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${newAddressUid}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.11) PUT Bacs status - directCreditPaymentsStatus missing ***/';
    const data = {
          directDebitPaymentsStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.12) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: directDebitPaymentsStatus missing ***/

const putBacsOutboundMissing = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.12) PUT Bacs status - directDebitPaymentsStatus missing ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.13) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: directCreditPaymentsStatus invalid ****/

const putBacsInboundInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.13) PUT Bacs status - directCreditPaymentsStatus invalid ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLEDXXXX",
          directDebitPaymentsStatus: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.14) PUT Bacs status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/bacs-payments-status: outbpundStatus invalid ****/

const putBacsOutboundInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUid}/bacs-payments-status`;
    const method = 'put';
    const action = '/*** (D.14) PUT Bacs status - directDebitPaymentsStatus invalid ***/';
    const data = {
          directCreditPaymentsStatus: "ENABLED",
          directDebitPaymentsStatus: "DISABLEDXXXX"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/************************************************* PB account status ********************************************/

/* *** (D.15.1) PUT status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/status: PB, acc, address valid ****/

const putStatusValid = async () => {
    const date = (new Date()).toISOString();
    // Note use the UID of an address that is already closed, otherwise none of the other tests
    // will be able to do anything to this address later!
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidClosed}/status`;
    const method = 'put';
    const action = '/*** (D.15.1) PUT status - PB, acc, addr valid ***/';
    const data = {
          status: "CLOSED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.15.2) PUT status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/status: address closed ****/

const putStatusAddressClosed = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidClosed}/status`;
    const method = 'put';
    const action = '/*** (D.15.2) PUT status - address closed ***/';
    const data = {
          status: "ACTIVE"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.16) PUT status /api/v1/{paymentBusinessUid}/account/{accountUid}/status: PB, acc, addr exist, not authorised ****/

const putStatusNotAuthorised = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUidNotAuthorised}/address/${addressUidNotAuthorised}/status`;
    const method = 'put';
    const action = '/*** (D.16) PUT status - PB, acc, addr exist, not auth ***/';
    const data = {
          status: "CLOSED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);
    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });

};

/* *** (D.17) PUT status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/status: PB, acc valid, addr not found ****/

const putStatusAddrNotFound = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUidNotFound}/status`;
    const method = 'put';
    const action = '/*** (D.17) PUT status - PB, acc valid, addr not found ***/';
    const data = {
          status: "CLOSED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/* *** (D.18) PUT status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/status: status missing ***/

const putStatusMissing = async () => {
    const newAddressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUidInvalid}/address/${newAddressUid}/status`;
    const method = 'put';
    const action = '/*** (D.18) PUT status - status missing ***/';
    const data = {
        statusxxx: "CLOSED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};


/* *** (D.19) PUT status /api/v1/{paymentBusinessUid}/account/{accountUid}/address/{addressUid}/status: status invalid ****/

const putStatusInvalid = async () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/status`;
    const method = 'put';
    const action = '/*** (D.19) PUT status - status invalid ***/';
    const data = {
          status: "DISABLED"
    }

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    // Do the call, and grab the response . . .
    const response = await makeRequest({ action, url, method, authorization, date, digest, data });
};

/*************************************** Run the test methods ****************************************/

/************************************* Payment business address tests C *************************************/

putFPSValid1()                                     /***** TEST D.1.1 ******/      /**** PUT FPS status tests ****/
    .then(() => putFPSValid2())                    /***** TEST D.1.2 ******/
    .then(() => putFPSAddressClosed())             /***** TEST D.1.3 ******/
    .then(() => putFPSNotAuthorised())             /***** TEST D.2 ******/
    .then(() => putFPSAddrNotFound())              /***** TEST D.3 ******/
    .then(() => putFPSInboundMissing())            /***** TEST D.4 ******/
    .then(() => putFPSOutboundMissing())           /***** TEST D.5 ******/
    .then(() => putFPSInboundInvalid())            /***** TEST D.6 ******/
    .then(() => putFPSOutboundInvalid())           /***** TEST D.7 ******/
    .then(() => putBacsValid1())                   /***** TEST D.8.1 ******/      /**** PUT Bacs status tests ****/
    .then(() => putBacsValid2())                   /***** TEST D.8.2 ******/
    .then(() => putBacsAddressClosed())            /***** TEST D.8.3 ******/
    .then(() => putBacsNotAuthorised())            /***** TEST D.9 ******/
    .then(() => putBacsAddrNotFound())             /***** TEST D.10 ******/
    .then(() => putBacsInboundMissing())           /***** TEST D.11 ******/
    .then(() => putBacsOutboundMissing())          /***** TEST D.12 ******/
    .then(() => putBacsInboundInvalid())           /***** TEST D.13 ******/
    .then(() => putBacsOutboundInvalid())          /***** TEST D.14 ******/
    .then(() => putStatusValid())                  /***** TEST D.15.1 ******/     /**** PUT status tests ****/
    .then(() => putStatusAddressClosed())          /***** TEST D.15.2 ******/
    .then(() => putStatusNotAuthorised())          /***** TEST D.16 ******/
    .then(() => putStatusAddrNotFound())           /***** TEST D.17 ******/
    .then(() => putStatusMissing())                /***** TEST D.18 ******/
    .then(() => putStatusInvalid())                /***** TEST D.19 ******/
