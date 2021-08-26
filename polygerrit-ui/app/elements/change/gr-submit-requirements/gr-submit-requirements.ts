/**
 * @license
 * Copyright (C) 2021 The Android Open Source Project
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
import '../gr-submit-requirement-hovercard/gr-submit-requirement-hovercard';
import {GrLitElement} from '../../lit/gr-lit-element';
import {css, customElement, html, property} from 'lit-element';
import {ParsedChangeInfo} from '../../../types/types';
import {
  AccountInfo,
  isDetailedLabelInfo,
  LabelNameToInfoMap,
  SubmitRequirementResultInfo,
  SubmitRequirementStatus,
} from '../../../api/rest-api';
import {assertNever} from '../../../utils/common-util';
import {extractAssociatedLabels} from '../../../utils/change-metadata-util';
import {Label} from '../gr-change-requirements/gr-change-requirements';

@customElement('gr-submit-requirements')
export class GrSubmitRequirements extends GrLitElement {
  @property({type: Object})
  change?: ParsedChangeInfo;

  @property({type: Object})
  account?: AccountInfo;

  @property({type: Boolean})
  mutable?: boolean;

  static override get styles() {
    return [
      css`
        :host {
          display: table;
          width: 100%;
        }
        .metadata-title {
          font-size: 100%;
          font-weight: var(--font-weight-bold);
          color: var(--deemphasized-text-color);
          padding-left: var(--metadata-horizontal-padding);
        }
        section {
          display: table-row;
        }
        .title {
          min-width: 10em;
          padding: var(--spacing-s) 0 0 0;
        }
        .value {
          padding: var(--spacing-s) 0 0 0;
        }
        .title,
        .status {
          display: table-cell;
          vertical-align: top;
        }
        .value {
          display: inline-flex;
        }
        .status {
          width: var(--line-height-small);
          padding: var(--spacing-s) var(--spacing-m) 0
            var(--requirements-horizontal-padding);
        }
        iron-icon {
          width: var(--line-height-small);
          height: var(--line-height-small);
        }
        iron-icon.satisfied {
          color: var(--success-foreground);
        }
        iron-icon.unsatisfied {
          color: var(--warning-foreground);
        }
        .testing {
          margin-top: var(--spacing-xxl);
          padding-left: var(--metadata-horizontal-padding);
          color: var(--deemphasized-text-color);
        }
        .testing gr-button {
          min-width: 25px;
        }
        .testing * {
          visibility: hidden;
        }
        .testing:hover * {
          visibility: visible;
        }
      `,
    ];
  }

  override render() {
    const submit_requirements = (this.change?.submit_requirements ?? []).filter(
      req => req.status !== SubmitRequirementStatus.NOT_APPLICABLE
    );
    return html`<h3 class="metadata-title">Submit Requirements</h3>
      ${submit_requirements.map(
        requirement => html`<section>
          <gr-submit-requirement-hovercard
            >${this.renderLabels(requirement)}
          </gr-submit-requirement-hovercard>
          <div class="status">${this.renderStatus(requirement.status)}</div>
          <div class="title">
            <gr-limited-text
              class="name"
              limit="25"
              text="${requirement.name}"
            ></gr-limited-text>
          </div>
          <div class="value">${this.renderVotes(requirement)}</div>
        </section>`
      )}${this.renderFakeControls()}`;
  }

  renderStatus(status: SubmitRequirementStatus) {
    let grIcon: string;
    switch (status) {
      case SubmitRequirementStatus.SATISFIED:
        grIcon = 'gr-icons:check';
        break;
      case SubmitRequirementStatus.UNSATISFIED:
        grIcon = 'gr-icons:close';
        break;
      case SubmitRequirementStatus.OVERRIDDEN:
        grIcon = 'gr-icons:warning';
        break;
      case SubmitRequirementStatus.NOT_APPLICABLE:
        grIcon = 'gr-icons:info';
        break;
      default:
        assertNever(status, `Unsupported status: ${status}`);
    }
    return html`<iron-icon
      class=${status.toLowerCase()}
      icon="${grIcon}"
    ></iron-icon>`;
  }

  renderVotes(requirement: SubmitRequirementResultInfo) {
    const requirementLabels = extractAssociatedLabels(requirement);
    const labels = this.change?.labels ?? {};

    return Object.keys(labels)
      .filter(label => requirementLabels.includes(label))
      .map(label => this.renderLabelVote(label, labels));
  }

  renderLabelVote(label: string, labels: LabelNameToInfoMap) {
    const labelInfo = labels[label];
    if (!isDetailedLabelInfo(labelInfo)) return;
    return (labelInfo.all ?? []).map(
      approvalInfo =>
        html`<gr-vote-chip
          .vote="${approvalInfo}"
          .label="${labelInfo}"
        ></gr-vote-chip>`
    );
  }

  renderLabels(requirement: SubmitRequirementResultInfo) {
    const requirementLabels = extractAssociatedLabels(requirement);
    const labels = this.change?.labels ?? {};

    const allLabels: Label[] = [];

    for (const label of Object.keys(labels)) {
      if (requirementLabels.includes(label)) {
        allLabels.push({
          labelName: label,
          icon: '',
          style: '',
          labelInfo: labels[label],
        });
      }
    }
    return allLabels.map(
      label => html`<gr-label-info
        .change="${this.change}"
        .account="${this.account}"
        .mutable="${this.mutable}"
        label="${label.labelName}"
        .labelInfo="${label.labelInfo}"
      ></gr-label-info>`
    );
  }

  renderFakeControls() {
    return html`
      <div class="testing">
        <div>Toggle fake data:</div>
        <gr-button link @click="${() => this.renderFakeSubmitRequirements()}"
          >G</gr-button
        >
      </div>
    `;
  }

  renderFakeSubmitRequirements() {
    if (!this.change) return;
    this.change = {
      ...this.change,
      submit_requirements: [
        {
          name: 'Code-Review',
          status: SubmitRequirementStatus.SATISFIED,
          description:
            "At least one maximum vote for label 'Code-Review' is required",
          submittability_expression_result: {
            expression: 'label:Code-Review=MAX -label:Code-Review=MIN',
            fulfilled: true,
            passing_atoms: [],
            failing_atoms: [],
          },
        },
        {
          name: 'Verified',
          status: SubmitRequirementStatus.UNSATISFIED,
          description: 'CI build and tests results are verified',
          submittability_expression_result: {
            expression: 'label:Verified=MAX -label:Verified=MIN',
            fulfilled: false,
            passing_atoms: [],
            failing_atoms: [],
          },
        },
      ],
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-submit-requirements': GrSubmitRequirements;
  }
}
