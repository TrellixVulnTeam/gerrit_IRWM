/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
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
import {html} from '@polymer/polymer/lib/utils/html-tag.js';

export const htmlTemplate = html`
    <style include="shared-styles">
      :host {
        display: block;
        font-family: var(--font-family);
        padding: var(--spacing-m);
      }
      :host([disabled]) {
        pointer-events: none;
      }
      :host([disabled]) .actions,
      :host([disabled]) .robotActions,
      :host([disabled]) .date {
        opacity: .5;
      }
      :host([discarding]) {
        display: none;
      }
      .header {
        align-items: center;
        cursor: pointer;
        display: flex;
        margin: calc(0px - var(--spacing-m)) calc(0px - var(--spacing-m)) 0 calc(0px - var(--spacing-m));
        padding: var(--spacing-m);
      }
      .headerLeft > span {
        font-weight: var(--font-weight-bold);
      }
      .container.collapsed .header {
        margin-bottom: calc(0 - var(--spacing-m));
      }
      .headerMiddle {
        color: var(--deemphasized-text-color);
        flex: 1;
        overflow: hidden;
      }
      .draftLabel,
      .draftTooltip {
        color: var(--deemphasized-text-color);
        display: none;
      }
      .date {
        justify-content: flex-end;
        margin-left: 5px;
        min-width: 4.5em;
        text-align: right;
        white-space: nowrap;
      }
      span.date {
        color: var(--deemphasized-text-color);
      }
      span.date:hover {
        text-decoration: underline;
      }
      .actions, .robotActions {
        display: flex;
        justify-content: flex-end;
        padding-top: 0;
      }
      .action {
        margin-left: var(--spacing-l);
      }
      .rightActions {
        display: flex;
        justify-content: flex-end;
      }
      .rightActions gr-button {
        --gr-button: {
          height: 20px;
          padding: 0 var(--spacing-s);
        }
      }
      .editMessage {
        display: none;
        margin: var(--spacing-m) 0;
        width: 100%;
      }
      .container:not(.draft) .actions .hideOnPublished {
        display: none;
      }
      .draft .reply,
      .draft .quote,
      .draft .ack,
      .draft .done {
        display: none;
      }
      .draft .draftLabel,
      .draft .draftTooltip {
        display: inline;
      }
      .draft:not(.editing) .save,
      .draft:not(.editing) .cancel {
        display: none;
      }
      .editing .message,
      .editing .reply,
      .editing .quote,
      .editing .ack,
      .editing .done,
      .editing .edit,
      .editing .discard,
      .editing .unresolved {
        display: none;
      }
      .editing .editMessage {
        display: block;
      }
      .show-hide {
        margin-left: var(--spacing-s);
      }
      .robotId {
        color: var(--deemphasized-text-color);
        margin-bottom: var(--spacing-m);
        margin-top: -.4em;
      }
      .robotIcon {
        margin-right: var(--spacing-xs);
        /* because of the antenna of the robot, it looks off center even when it
         is centered. artificially adjust margin to account for this. */
        margin-top: -4px;
      }
      .runIdInformation {
        margin: var(--spacing-m) 0;
      }
      .robotRun {
        margin-left: var(--spacing-m);
      }
      .robotRunLink {
        margin-left: var(--spacing-m);
      }
      input.show-hide {
        display: none;
      }
      label.show-hide {
        cursor: pointer;
        display: block;
      }
      label.show-hide iron-icon {
        vertical-align: top;
      }
      #container .collapsedContent {
        display: none;
      }
      #container.collapsed {
        padding-bottom: 3px;
      }
      #container.collapsed .collapsedContent {
        display: block;
        overflow: hidden;
        padding-left: 5px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #container.collapsed .actions,
      #container.collapsed gr-formatted-text,
      #container.collapsed gr-textarea,
      #container.collapsed .respectfulReviewTip{
        display: none;
      }
      .resolve,
      .unresolved {
        align-items: center;
        display: flex;
        flex: 1;
        margin: 0;
      }
      .resolve label {
        color: var(--comment-text-color);
      }
      gr-dialog .main {
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      #deleteBtn {
        display: none;
        --gr-button: {
          color: var(--deemphasized-text-color);
          padding: 0;
        }
      }
      #deleteBtn.showDeleteButtons {
        display: block;
      }

      /** Disable select for the caret and actions */
      .actions,
      .show-hide {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      .respectfulReviewTip {
        justify-content: space-between;
        display: flex;
        padding: var(--spacing-m);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-m);
      }
      .respectfulReviewTip div {
        display: flex;
      }
      .respectfulReviewTip div iron-icon {
        margin-right: var(--spacing-s);
      }
      .respectfulReviewTip a {
        white-space: nowrap;
        margin-right: var(--spacing-s);
        padding-left: var(--spacing-m);
        text-decoration: none;
      }
      .pointer {
        cursor: pointer;
      }
    </style>
    <div id="container" class="container">
      <div class="header" id="header" on-click="_handleToggleCollapsed">
        <div class="headerLeft">
          <span class="authorName">[[_computeAuthorName(comment)]]</span>
          <span class="draftLabel">DRAFT</span>
          <gr-tooltip-content class="draftTooltip" has-tooltip="" title="This draft is only visible to you. To publish drafts, click the 'Reply' or 'Start review' button at the top of the change or press the 'A' key." max-width="20em" show-icon=""></gr-tooltip-content>
        </div>
        <div class="headerMiddle">
          <span class="collapsedContent">[[comment.message]]</span>
        </div>
        <div hidden\$="[[_computeHideRunDetails(comment, collapsed)]]" class="runIdMessage message">
          <div class="runIdInformation">
            <a class="robotRunLink" href\$="[[comment.url]]">
              <span class="robotRun link">Run Details</span>
            </a>
          </div>
        </div>
        <gr-button id="deleteBtn" link="" class\$="action delete [[_computeDeleteButtonClass(_isAdmin, draft)]]" hidden\$="[[isRobotComment]]" on-click="_handleCommentDelete">
          <iron-icon id="icon" icon="gr-icons:delete"></iron-icon>
        </gr-button>
        <span class="date" on-click="_handleAnchorClick">
          <gr-date-formatter has-tooltip="" date-str="[[comment.updated]]"></gr-date-formatter>
        </span>
        <div class="show-hide">
          <label class="show-hide">
            <input type="checkbox" class="show-hide" checked\$="[[collapsed]]" on-change="_handleToggleCollapsed">
            <iron-icon id="icon" icon="[[_computeShowHideIcon(collapsed)]]">
            </iron-icon>
          </label>
        </div>
      </div>
      <div class="body">
        <template is="dom-if" if="[[isRobotComment]]">
          <div class="robotId" hidden\$="[[collapsed]]">
            [[comment.author.name]]
          </div>
        </template>
        <template is="dom-if" if="[[editing]]">
          <gr-textarea id="editTextarea" class="editMessage" autocomplete="on" code="" disabled="{{disabled}}" rows="4" text="{{_messageText}}"></gr-textarea>
          <template is="dom-if" if="[[_computeVisibilityOfTip(_showRespectfulTip, _respectfulTipDismissed)]]">
            <div class="respectfulReviewTip">
              <div>
                <gr-tooltip-content has-tooltip="" title="Tips for respectful code reviews.">
                  <iron-icon class="pointer" icon="gr-icons:lightbulb-outline"></iron-icon>
                </gr-tooltip-content>
                [[_respectfulReviewTip]]
              </div>
              <div>
                <a tabindex="-1" on-click="_onRespectfulReadMoreClick" href="https://testing.googleblog.com/2019/11/code-health-respectful-reviews-useful.html" target="_blank">
                  Read more
                </a>
                <a tabindex="-1" class="close pointer" on-click="_dismissRespectfulTip">Not helpful</a>
              </div>
            </div>
          </template>
        </template>
        <!--The message class is needed to ensure selectability from
        gr-diff-selection.-->
        <gr-formatted-text class="message" content="[[comment.message]]" no-trailing-margin="[[!comment.__draft]]" config="[[projectConfig.commentlinks]]"></gr-formatted-text>
        <div class="actions humanActions" hidden\$="[[!_showHumanActions]]">
          <div class="action resolve hideOnPublished">
            <label>
              <input type="checkbox" id="resolvedCheckbox" checked="[[resolved]]" on-change="_handleToggleResolved">
              Resolved
            </label>
          </div>
          <div class="rightActions">
            <gr-button link="" class="action cancel hideOnPublished" on-click="_handleCancel">Cancel</gr-button>
            <gr-button link="" class="action discard hideOnPublished" on-click="_handleDiscard">Discard</gr-button>
            <gr-button link="" class="action edit hideOnPublished" on-click="_handleEdit">Edit</gr-button>
            <gr-button link="" disabled\$="[[_computeSaveDisabled(_messageText, comment, resolved)]]" class="action save hideOnPublished" on-click="_handleSave">Save</gr-button>
          </div>
        </div>
        <div class="robotActions" hidden\$="[[!_showRobotActions]]">
          <template is="dom-if" if="[[isRobotComment]]">
            <gr-endpoint-decorator name="robot-comment-controls">
              <gr-endpoint-param name="comment" value="[[comment]]">
              </gr-endpoint-param>
            </gr-endpoint-decorator>
            <gr-button link="" secondary="" class="action show-fix" hidden\$="[[_hasNoFix(comment)]]" on-click="_handleShowFix">
              Show Fix
            </gr-button>
            <template is="dom-if" if="[[!_hasHumanReply]]">
              <gr-button link="" class="action fix" on-click="_handleFix" disabled="[[robotButtonDisabled]]">
                Please Fix
              </gr-button>
            </template>
          </template>
        </div>
      </div>
    </div>
    <template is="dom-if" if="[[_enableOverlay]]">
      <gr-overlay id="confirmDeleteOverlay" with-backdrop="">
        <gr-confirm-delete-comment-dialog id="confirmDeleteComment" on-confirm="_handleConfirmDeleteComment" on-cancel="_handleCancelDeleteComment">
        </gr-confirm-delete-comment-dialog>
      </gr-overlay>
      <gr-overlay id="confirmDiscardOverlay" with-backdrop="">
        <gr-dialog id="confirmDiscardDialog" confirm-label="Discard" confirm-on-enter="" on-confirm="_handleConfirmDiscard" on-cancel="_closeConfirmDiscardOverlay">
          <div class="header" slot="header">
            Discard comment
          </div>
          <div class="main" slot="main">
            Are you sure you want to discard this draft comment?
          </div>
        </gr-dialog>
      </gr-overlay>
    </template>
    <gr-rest-api-interface id="restAPI"></gr-rest-api-interface>
    <gr-storage id="storage"></gr-storage>
    <gr-reporting id="reporting"></gr-reporting>
`;
