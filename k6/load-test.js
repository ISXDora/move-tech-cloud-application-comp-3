import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // aquecimento
    { duration: '1m', target: 300 },   // alvo declarado: 300 req/s aprox.
    { duration: '30s', target: 0 },    // desaceleração
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // o RNF declarado
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://201.23.88.219/orders');
  check(res, { 'status 200': (r) => r.status === 200 });
}

