/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'ava'

import { smarthome, SmartHomeJwt } from '../smarthome'
import * as Api from '../api/v1'
import { Headers } from '../../../framework'
import * as Sample from './expected'

const agentUserId = '123'
const sampleApiKey = '<API-KEY>'

const throwError = () => {
  throw Error('')
}

const SAMPLE_JWT: SmartHomeJwt = {
  type: 'service_account',
  project_id: 'sample-project-id',
  private_key_id: 'sample-private-key-id',
  private_key: 'sample-private-key',
  client_email: 'sample-client-email',
  client_id: 'sample-client-id',
  auth_uri: 'http://example.com/auth',
  token_uri: 'http://example.com/token',
  auth_provider_x509_cert_url: 'https://example.com/certs',
  client_x509_cert_url: 'https://example.com/x509-certs',
}

test('sync intent handler is invoked', (t) => {
  const app = smarthome()
  let invoked = false

  const intentHandler = (body: Api.SmartHomeV1Request) => {
    invoked = true
    return Sample.SYNC_RESPONSE
  }
  app.onSync(intentHandler)
  app.onQuery(throwError)
  app.onExecute(throwError)

  const promise = app.handler(Sample.SYNC_REQUEST, {})

  return promise.then((result) => {
    t.is(result.status, 200)
    t.is(result.body, Sample.SYNC_RESPONSE)
    t.true(invoked)
  })
})

test('query intent handler is invoked', (t) => {
  const app = smarthome()
  let invoked = false

  const intentHandler = (body: Api.SmartHomeV1Request) => {
    invoked = true
    return Sample.QUERY_RESPONSE
  }
  app.onSync(throwError)
  app.onQuery(intentHandler)
  app.onExecute(throwError)

  const promise = app.handler(Sample.QUERY_REQUEST, {})

  return promise.then((result) => {
    t.is(result.status, 200)
    t.is(result.body, Sample.QUERY_RESPONSE)
    t.true(invoked)
  })
})

test('execute intent handler is invoked', (t) => {
  const app = smarthome()
  let invoked = false

  const intentHandler = (body: Api.SmartHomeV1Request) => {
    invoked = true
    return Sample.EXECUTE_RESPONSE
  }
  app.onSync(throwError)
  app.onQuery(throwError)
  app.onExecute(intentHandler)

  const promise = app.handler(Sample.EXECUTE_REQUEST, {})

  return promise.then((result) => {
    t.is(result.status, 200)
    t.is(result.body, Sample.EXECUTE_RESPONSE)
    t.true(invoked)
  })
})

test('request sync fails if no API key is defined', (t) => {
  const app = smarthome()

  return app.requestSync(agentUserId)
    .then(() => {
      t.fail('You should not be able to call request without an API key')
    })
    .catch(() => {
      t.pass('This method call properly throws an error')
    })
})

test('request sync succeeds if API key is defined', (t) => {
  const app = smarthome({
    key: sampleApiKey,
  })

  return app.requestSync(agentUserId)
    .then(() => {
      t.pass('The API was called successfully')
    })
    .catch((e) => {
      t.fail('You should be able to call request with an API key')
    })
})

test('report state fails if JWT is not defined', (t) => {
  const app = smarthome()

  return app.reportState(Sample.REPORT_STATE_REQUEST)
    .then(() => {
      t.fail('You should not be able to call request without a JWT')
    })
    .catch((e) => {
      t.pass('This method call properly throws an error')
    })
})

test('report state succeeds if JWT is defined', (t) => {
  const app = smarthome({
    jwt: SAMPLE_JWT,
  })

  return app.reportState(Sample.REPORT_STATE_REQUEST)
    .then(() => {
      t.pass('The API was called successfully')
    })
    .catch((e) => {
      t.fail('You should be able to call request with a JWT')
    })
})

test('verifies headers are sent along with body', (t) => {
  const app = smarthome()
  let authToken = ''

  const intentHandler = (body: Api.SmartHomeV1Request, headers: Headers) => {
    if (!Array.isArray(headers.authorization) && headers.authorization !== undefined) {
      authToken = headers.authorization
    }
    return Sample.SYNC_RESPONSE
  }
  app.onSync(intentHandler)
  app.onQuery(throwError)
  app.onExecute(throwError)

  const promise = app.handler(Sample.SYNC_REQUEST, Sample.SMART_HOME_HEADERS)

  return promise.then((result) => {
    t.is(result.status, 200)
    t.is(authToken, 'Bearer TOKEN')
  })
})