/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {assert} from '@open-wc/testing';
import {SinonStub} from 'sinon';
import {
  BranchName,
  NumericChangeId,
  RepoName,
  TopicName,
} from '../../api/rest-api';
import {navigationToken} from '../../elements/core/gr-navigation/gr-navigation';
import '../../test/common-test-setup';
import {testResolver} from '../../test/common-test-setup';
import {createChange} from '../../test/test-data-generators';
import {
  createSearchUrl,
  SearchUrlOptions,
  SearchViewModel,
  searchViewModelToken,
} from './search';

const CHANGE_ID = 'IcA3dAB3edAB9f60B8dcdA6ef71A75980e4B7127';
const COMMIT_HASH = '12345678';

suite('search view state tests', () => {
  test('createSearchUrl', () => {
    let options: SearchUrlOptions = {
      owner: 'a%b',
      project: 'c%d' as RepoName,
      branch: 'e%f' as BranchName,
      topic: 'g%h' as TopicName,
      statuses: ['op%en'],
    };
    assert.equal(
      createSearchUrl(options),
      '/q/owner:a%2525b+project:c%2525d+branch:e%2525f+' +
        'topic:g%2525h+status:op%2525en'
    );

    options.offset = 100;
    assert.equal(
      createSearchUrl(options),
      '/q/owner:a%2525b+project:c%2525d+branch:e%2525f+' +
        'topic:g%2525h+status:op%2525en,100'
    );
    delete options.offset;

    // The presence of the query param overrides other options.
    options.query = 'foo$bar';
    assert.equal(createSearchUrl(options), '/q/foo%2524bar');

    options.offset = 100;
    assert.equal(createSearchUrl(options), '/q/foo%2524bar,100');

    options = {statuses: ['a', 'b', 'c']};
    assert.equal(
      createSearchUrl(options),
      '/q/(status:a OR status:b OR status:c)'
    );

    options = {topic: 'test' as TopicName};
    assert.equal(createSearchUrl(options), '/q/topic:test');

    options = {topic: 'test test' as TopicName};
    assert.equal(createSearchUrl(options), '/q/topic:"test+test"');

    options = {topic: 'test:test' as TopicName};
    assert.equal(createSearchUrl(options), '/q/topic:"test:test"');
  });

  suite('query based navigation', () => {
    let replaceUrlStub: SinonStub;
    let model: SearchViewModel;

    setup(() => {
      model = testResolver(searchViewModelToken);
      replaceUrlStub = sinon.stub(testResolver(navigationToken), 'replaceUrl');
    });

    teardown(() => {
      model.finalize();
    });

    test('Searching for a change ID redirects to change', async () => {
      const change = {...createChange(), _number: 1 as NumericChangeId};

      model.redirectSingleResult(CHANGE_ID, [change]);

      assert.isTrue(replaceUrlStub.called);
      assert.equal(replaceUrlStub.lastCall.firstArg, '/c/test-project/+/1');
    });

    test('Searching for a change num redirects to change', async () => {
      const change = {...createChange(), _number: 1 as NumericChangeId};

      model.redirectSingleResult('1', [change]);

      assert.isTrue(replaceUrlStub.called);
      assert.equal(replaceUrlStub.lastCall.firstArg, '/c/test-project/+/1');
    });

    test('Commit hash redirects to change', async () => {
      const change = {...createChange(), _number: 1 as NumericChangeId};

      model.redirectSingleResult(COMMIT_HASH, [change]);

      assert.isTrue(replaceUrlStub.called);
      assert.equal(replaceUrlStub.lastCall.firstArg, '/c/test-project/+/1');
    });

    test('No results: no redirect', async () => {
      model.redirectSingleResult(CHANGE_ID, []);

      assert.isFalse(replaceUrlStub.called);
    });

    test('More than 1 result: no redirect', async () => {
      const change1 = {...createChange(), _number: 1 as NumericChangeId};
      const change2 = {...createChange(), _number: 2 as NumericChangeId};

      model.redirectSingleResult(CHANGE_ID, [change1, change2]);

      assert.isFalse(replaceUrlStub.called);
    });
  });
});
