#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EwdAss1Stack } from '../lib/ewd-ass1-stack';
import { AuthAppStack } from '../lib/auth-api-stack';

const app = new cdk.App();
new EwdAss1Stack(app, 'EwdAss1Stack');
new AuthAppStack(app, 'AuthAppStack');