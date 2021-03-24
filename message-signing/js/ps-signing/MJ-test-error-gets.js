const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'a005c2a3-d87a-40d7-bf8c-82575c0a570c';
const paymentBusinessUid = '53f74c7d-c666-422e-a871-b2a03623addd';
const paymentBusinessUidNotFound = '53f74c7d-c666-422e-a871-b2a03623accc';
const paymentBusinessUidNotAuthorised = '4389532d-8b5d-44ad-9f69-d2124cb9a603';
const accountUid = '09dbbfac-50b1-47f3-ac7b-a37d828bd25b';
const sortCode = '040059';

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

const makeRequest = ({ url, method, authorization, date, digest, data = '' }) => axios.request({
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
    .then(response => console.log(response.data))
    .catch(err => console.error(err.response));

const getAccount = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
};

const getAccountError = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotFound}/account/${accountUid}`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
};

const getAccountNotAuthorised = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUidNotAuthorised}/account/${accountUid}`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
};

getAccount()
    .then(() => getAccountError()
        .then(() => getAccountNotAuthorised()));
