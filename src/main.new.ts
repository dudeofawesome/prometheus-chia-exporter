import { register, Gauge, Counter, Histogram } from 'prom-client';

new Gauge({
  name: 'test',
  help: 'my test gauge',
  async collect() {
    this.set(0);
  },
});

const express = require('express');
const server = express();

// Setup server to Prometheus scrapes:

server.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

server.get('/metrics/counter', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.getSingleMetricAsString('test_counter'));
  } catch (ex) {
    res.status(500).end(ex);
  }
});

const port = process.env.PORT || 9133;
console.log(
  `Server listening to ${port}, metrics exposed on /metrics endpoint`,
);
server.listen(port);
