const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const uuid = require('uuid').v4;

// Configuration. Don't hardcode these in production
const keyUid = 'e80362a0-fd9e-47a0-933f-723a86ffc94b';
const accessToken = 'eyJhbGciOiJQUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAAAG2RS07DMBCGr4K87lSJ42d37LgABxjbk2I1taPYRVSIu-M0RYiK5Xzz__P8ZLEUdmA4Rwh0zvtScZliOjpMp73PZ7Zj5eKaQnd8JD8EICUMCKMHME5xsONgun7kVuPQxPQxs0Oves2t0krvWMR6B303rAC9z5dUX_IUaHmNodWmseuNsgROSwdCBQSrewm9skIqIZHrsdWu-URpcwjNuSIxAO9GC6KTBoy2CmRvg9bcKS9Cc7S1nr2nUjaXtKgMGQVogwCB3oKjzoPkg-2GILl3al3Y55nWo2yTwtttVEh4psNCGJ4eEvU6PyRioFTjGGn5y6dY6kYcTpj83TbjFabscYK8Mt9gpV-6iQq-t78UOOb_CNQFUxl_Gt4i9DXmdAPs6xtm3BLH6gEAAA.Zh4_WK1ApFiDusN18MZyoC6TsVhqleOLhcrpxObpK6c7W0roAaI_wYhumAdFkiNdXJHDxNOeAzLTsztDlC432O90EKbJVgoPqVp-1mzhyPojs72i5fPldqEzBne4jCqcuPMrEt2IpJ1724THyvnyQWm06IejKUAuteg7_nVewIp3RYeMOYH8onOpAsKcHy37MaocQRUTiSxyXg0b1igYFSofY-gry87eYGWpKRC2f76RiQiMEQUz8R5A874AXbcGtBNx09JG_1ASwr-Vakj08HiyrmTW8q7sS6jq51_27g5ZzqHe5tNb2X1yRYWlmrWEfa8jLWivR9Rp-_4BT3Iv4xeOej2tpFTotE3fEdtemzMS_WH1rC5oTMGlOOauAEhOI5wdqqKZX1AMco6dBhIR0ARHnDtHUiu322B75kxLMqXXgxzbJrFwSYAmXAt-8K35zN943wZkOxcoI3ez80plx20XNMYSmrLbN523GGH9fqy7JCmFfI7_PvzS193pm3ybr7G5__GLPN7CW8mezFRXtpjNmVjbdAjxbao6fs6nR255WaiPa05RpCvT6ShecTWU5p7Ho5UhCZGIRh2dix1pd9s6UugvLNulQNpPEaSCb-m3TYRq89io3YpL_CsCdVsDuIT8xBxUkMU2x-llKdAiXy8kBAhMWsVryOo8LeYzKRs';
const accountUid = '867a56b8-8085-437a-b8f9-c6aec583c3bb';
const categoryUid = 'f7ca2a71-8fd4-43b7-b42c-a1669a4afae0';

const baseURL = 'https://api-sandbox.starlingbank.com';
const method = 'put';
const url = `/api/v2/payments/local/account/${accountUid}/category/${categoryUid}`;
const date = (new Date()).toISOString();
const data = JSON.stringify({
  externalIdentifier: uuid(),
  paymentRecipient: {
    payeeName: "Elise Gram",
    payeeType: "INDIVIDUAL",
    countryCode: "GB",
    accountIdentifier: "65338481",
    bankIdentifier: "608371",
    bankIdentifierType: "SORT_CODE"
  },
  reference: "sipResendAsFdp",
  amount: {
    currency: "GBP",
    minorUnits: 1
  }
});

const digest = crypto
  .createHash('sha512')
  .update(data)
  .digest('base64');

const signature = crypto
  .createSign('RSA-SHA512')
  .update(`(request-target): put ${url}\nDate: ${date}\nDigest: ${digest}`)
  .sign(fs.readFileSync('starling-api-private.key'), 'base64');

const authorization = `Bearer ${accessToken};Signature keyid="${keyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`

axios.request({
  baseURL,
  url,
  method,
  data,
  headers: {
    Authorization: authorization,
    Date: date,
    Digest: digest,
    'Content-Type': 'application/json',
    'User-Agent': 'api-samples/message-signing/js/signer'
  }
})
.then(response => console.log(response))
.catch(err => console.error(err.response.data))
