#!/usr/bin/env node
const cdk = require('@aws-cdk/cdk');
const { TradingEc2CodepipelineStack } = require('../lib/trading-ec2-codepipeline-stack');

const app = new cdk.App();
new TradingEc2CodepipelineStack(app, 'TradingEc2CodepipelineStack');
app.run();
