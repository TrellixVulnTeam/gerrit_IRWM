/**
 * @license
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '../../../test/common-test-setup-karma.js';
import './gr-create-change-dialog.js';

const basicFixture = fixtureFromElement('gr-create-change-dialog');

suite('gr-create-change-dialog tests', () => {
  let element;

  setup(() => {
    stub('gr-rest-api-interface', {
      getLoggedIn() { return Promise.resolve(true); },
      getRepoBranches(input) {
        if (input.startsWith('test')) {
          return Promise.resolve([
            {
              ref: 'refs/heads/test-branch',
              revision: '67ebf73496383c6777035e374d2d664009e2aa5c',
              can_delete: true,
            },
          ]);
        } else {
          return Promise.resolve({});
        }
      },
    });
    element = basicFixture.instantiate();
    element.repoName = 'test-repo';
    element._repoConfig = {
      private_by_default: {
        configured_value: 'FALSE',
        inherited_value: false,
      },
    };
  });

  test('new change created with default', done => {
    const configInputObj = {
      branch: 'test-branch',
      subject: 'first change created with polygerrit ui',
      topic: 'test-topic',
      is_private: false,
      work_in_progress: true,
    };

    const saveStub = sinon.stub(element.$.restAPI,
        'createChange').callsFake(() => Promise.resolve({}));

    element.branch = 'test-branch';
    element.topic = 'test-topic';
    element.subject = 'first change created with polygerrit ui';
    assert.isFalse(element.$.privateChangeCheckBox.checked);

    element.$.branchInput.bindValue = configInputObj.branch;
    element.$.tagNameInput.bindValue = configInputObj.topic;
    element.$.messageInput.bindValue = configInputObj.subject;

    element.handleCreateChange().then(() => {
      // Private change
      assert.isFalse(saveStub.lastCall.args[4]);
      // WIP Change
      assert.isTrue(saveStub.lastCall.args[5]);
      assert.isTrue(saveStub.called);
      done();
    });
  });

  test('new change created with private', done => {
    element.privateByDefault = {
      configured_value: 'TRUE',
      inherited_value: false,
    };
    sinon.stub(element, '_formatBooleanString')
        .callsFake(() => Promise.resolve(true));
    flush();

    const configInputObj = {
      branch: 'test-branch',
      subject: 'first change created with polygerrit ui',
      topic: 'test-topic',
      is_private: true,
      work_in_progress: true,
    };

    const saveStub = sinon.stub(element.$.restAPI,
        'createChange').callsFake(() => Promise.resolve({}));

    element.branch = 'test-branch';
    element.topic = 'test-topic';
    element.subject = 'first change created with polygerrit ui';
    assert.isTrue(element.$.privateChangeCheckBox.checked);

    element.$.branchInput.bindValue = configInputObj.branch;
    element.$.tagNameInput.bindValue = configInputObj.topic;
    element.$.messageInput.bindValue = configInputObj.subject;

    element.handleCreateChange().then(() => {
      // Private change
      assert.isTrue(saveStub.lastCall.args[4]);
      // WIP Change
      assert.isTrue(saveStub.lastCall.args[5]);
      assert.isTrue(saveStub.called);
      done();
    });
  });

  test('_getRepoBranchesSuggestions empty', done => {
    element._getRepoBranchesSuggestions('nonexistent').then(branches => {
      assert.equal(branches.length, 0);
      done();
    });
  });

  test('_getRepoBranchesSuggestions non-empty', done => {
    element._getRepoBranchesSuggestions('test-branch').then(branches => {
      assert.equal(branches.length, 1);
      assert.equal(branches[0].name, 'test-branch');
      done();
    });
  });

  test('_computeBranchClass', () => {
    assert.equal(element._computeBranchClass(true), 'hide');
    assert.equal(element._computeBranchClass(false), '');
  });

  test('_computePrivateSectionClass', () => {
    assert.equal(element._computePrivateSectionClass(true), 'hide');
    assert.equal(element._computePrivateSectionClass(false), '');
  });
});

