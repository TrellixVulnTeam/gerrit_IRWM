// Copyright (C) 2020 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.acceptance.rest;

import static com.google.common.net.HttpHeaders.ORIGIN;
import static com.google.common.truth.Truth.assertThat;
import static com.google.gerrit.httpd.restapi.RestApiServlet.X_GERRIT_UPDATED_REF;
import static org.apache.http.HttpStatus.SC_OK;

import com.google.gerrit.acceptance.AbstractDaemonTest;
import com.google.gerrit.acceptance.PushOneCommit.Result;
import com.google.gerrit.acceptance.RestResponse;
import com.google.gerrit.entities.Project;
import com.google.gerrit.entities.RefNames;
import com.google.gerrit.extensions.api.changes.ReviewInput;
import com.google.gerrit.extensions.restapi.Url;
import com.google.gerrit.httpd.restapi.RestApiServlet;
import java.io.IOException;
import java.util.List;
import java.util.regex.Pattern;
import org.apache.http.message.BasicHeader;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Repository;
import org.junit.Test;

public class RestApiServletIT extends AbstractDaemonTest {
  private static String ANY_REST_API = "/accounts/self/capabilities";
  private static BasicHeader ACCEPT_STAR_HEADER = new BasicHeader("Accept", "*/*");
  private static Pattern ANY_SPACE = Pattern.compile("\\s");

  @Test
  public void restResponseBodyShouldBeCompactWithoutSpaces() throws Exception {
    RestResponse response = adminRestSession.getWithHeaders(ANY_REST_API, ACCEPT_STAR_HEADER);
    assertThat(response.getStatusCode()).isEqualTo(SC_OK);

    assertThat(contentWithoutMagicJson(response)).doesNotContainMatch(ANY_SPACE);
  }

  @Test
  public void restResponseBodyShouldBeCompactWithoutSpacesWhenPPIsZero() throws Exception {
    assertThat(contentWithoutMagicJson(prettyJsonRestResponse("prettyPrint", 0)))
        .doesNotContainMatch(ANY_SPACE);
  }

  @Test
  public void restResponseBodyShouldBeCompactWithoutSpacesWhenPrerryPrintIsZero() throws Exception {
    assertThat(contentWithoutMagicJson(prettyJsonRestResponse("pp", 0)))
        .doesNotContainMatch(ANY_SPACE);
  }

  @Test
  public void restResponseBodyShouldBePrettyfiedWhenPPIsOne() throws Exception {
    assertThat(contentWithoutMagicJson(prettyJsonRestResponse("pp", 1))).containsMatch(ANY_SPACE);
  }

  @Test
  public void restResponseBodyShouldBePrettyfiedWhenPrettyPrintIsOne() throws Exception {
    assertThat(contentWithoutMagicJson(prettyJsonRestResponse("prettyPrint", 1)))
        .containsMatch(ANY_SPACE);
  }

  @Test
  public void xGerritUpdatedRefNotSetForReadRequests() throws Exception {
    RestResponse response = adminRestSession.getWithHeaders(ANY_REST_API, ACCEPT_STAR_HEADER);
    assertThat(response.getStatusCode()).isEqualTo(SC_OK);
    assertThat(response.getHeader(X_GERRIT_UPDATED_REF)).isNull();
  }

  @Test
  public void xGerritUpdatedRefSetForDifferentWriteRequests() throws Exception {
    Result change = createChange();
    String origin = adminRestSession.url();
    String project = change.getChange().project().get();
    String metaRef = RefNames.changeMetaRef(change.getChange().getId());

    ObjectId originalMetaRefSha1 = getMetaRefSha1(change);

    RestResponse response =
        adminRestSession.putWithHeaders(
            "/changes/" + change.getChangeId() + "/topic",
            /* content= */ "A",
            new BasicHeader(ORIGIN, origin));
    response.assertOK();
    assertThat(gApi.changes().id(change.getChangeId()).topic()).isEqualTo("A");
    ObjectId firstMetaRefSha1 = getMetaRefSha1(change);

    // Meta ref updated because of topic update.
    assertThat(response.getHeader(X_GERRIT_UPDATED_REF))
        .isEqualTo(
            String.format(
                "%s~%s~%s~%s",
                Url.encode(project),
                Url.encode(metaRef),
                originalMetaRefSha1.getName(),
                firstMetaRefSha1.getName()));

    response =
        adminRestSession.putWithHeaders(
            "/changes/" + change.getChangeId() + "/topic",
            /* content= */ "B",
            new BasicHeader(ORIGIN, origin));
    response.assertOK();
    assertThat(gApi.changes().id(change.getChangeId()).topic()).isEqualTo("B");

    ObjectId secondMetaRefSha1 = getMetaRefSha1(change);

    // Meta ref updated again because of another topic update.
    assertThat(response.getHeader(X_GERRIT_UPDATED_REF))
        .isEqualTo(
            String.format(
                "%s~%s~%s~%s",
                Url.encode(project),
                Url.encode(metaRef),
                firstMetaRefSha1.getName(),
                secondMetaRefSha1.getName()));

    // Ensure the meta ref SHA-1 changed for the project~metaRef which means we return different
    // X-Gerrit-UpdatedRef headers.
    assertThat(secondMetaRefSha1).isNotEqualTo(firstMetaRefSha1);
  }

  @Test
  public void xGerritUpdatedRefDeleted() throws Exception {
    Result change = createChange();
    String project = change.getChange().project().get();
    String metaRef = RefNames.changeMetaRef(change.getChange().getId());
    String patchSetRef = RefNames.patchSetRef(change.getPatchSetId());

    ObjectId originalMetaRefSha1 = getMetaRefSha1(change);
    ObjectId originalchangeRefSha1 = change.getCommit().getId();

    RestResponse response = adminRestSession.delete("/changes/" + change.getChangeId());
    response.assertNoContent();

    List<String> headers = response.getHeaders(X_GERRIT_UPDATED_REF);

    // The change was deleted, so the refs were deleted which means they are ObjectId.zeroId().
    assertThat(headers)
        .containsExactly(
            String.format(
                "%s~%s~%s~%s",
                Url.encode(project),
                Url.encode(metaRef),
                originalMetaRefSha1.getName(),
                ObjectId.zeroId().getName()),
            String.format(
                "%s~%s~%s~%s",
                Url.encode(project),
                Url.encode(patchSetRef),
                originalchangeRefSha1.getName(),
                ObjectId.zeroId().getName()));
  }

  @Test
  public void xGerritUpdatedRefWithProjectNameContainingTilde() throws Exception {
    Project.NameKey project = createProjectOverAPI("~~pr~oje~ct~~~~", null, true, null);
    Result change = createChange(cloneProject(project, admin));
    String metaRef = RefNames.changeMetaRef(change.getChange().getId());
    String patchSetRef = RefNames.patchSetRef(change.getPatchSetId());

    ObjectId originalMetaRefSha1 = getMetaRefSha1(change);
    ObjectId originalchangeRefSha1 = change.getCommit().getId();

    RestResponse response = adminRestSession.delete("/changes/" + change.getChangeId());
    response.assertNoContent();

    List<String> headers = response.getHeaders(X_GERRIT_UPDATED_REF);

    // The change was deleted, so the refs were deleted which means they are ObjectId.zeroId().
    assertThat(headers)
        .containsExactly(
            String.format(
                "%s~%s~%s~%s",
                Url.encode(project.get()),
                Url.encode(metaRef),
                originalMetaRefSha1.getName(),
                ObjectId.zeroId().getName()),
            String.format(
                "%s~%s~%s~%s",
                Url.encode(project.get()),
                Url.encode(patchSetRef),
                originalchangeRefSha1.getName(),
                ObjectId.zeroId().getName()));

    // Ensures ~ gets encoded to %7E.
    assertThat(Url.encode(project.get())).endsWith("%7E%7Epr%7Eoje%7Ect%7E%7E%7E%7E");
  }

  @Test
  public void xGerritUpdatedRefSetMultipleHeadersForSubmit() throws Exception {
    Result change1 = createChange();
    Result change2 = createChange();
    String metaRef1 = RefNames.changeMetaRef(change1.getChange().getId());
    String metaRef2 = RefNames.changeMetaRef(change2.getChange().getId());

    gApi.changes().id(change1.getChangeId()).current().review(ReviewInput.approve());
    gApi.changes().id(change2.getChangeId()).current().review(ReviewInput.approve());

    Project.NameKey project = change1.getChange().project();

    try (Repository repository = repoManager.openRepository(project)) {
      ObjectId originalFirstMetaRefSha1 = getMetaRefSha1(change1);
      ObjectId originalSecondMetaRefSha1 = getMetaRefSha1(change2);
      ObjectId originalDestinationBranchSha1 =
          repository.resolve(change1.getChange().change().getDest().branch());

      RestResponse response =
          adminRestSession.post("/changes/" + change2.getChangeId() + "/submit");
      response.assertOK();

      ObjectId firstMetaRefSha1 = getMetaRefSha1(change1);
      ObjectId secondMetaRefSha1 = getMetaRefSha1(change2);

      List<String> headers = response.getHeaders(X_GERRIT_UPDATED_REF);

      String branch = change1.getChange().change().getDest().branch();
      String branchSha1 =
          repository
              .getRefDatabase()
              .exactRef(change1.getChange().change().getDest().branch())
              .getObjectId()
              .name();

      // During submit, all relevant meta refs of the latest patchset are updated + the destination
      // branch/es.
      // TODO(paiking): This doesn't work well for torn submissions: If the changes were in
      // different projects in the same topic, and we tried to submit those changes together, it's
      // possible that the first submission only submitted one of the changes, and then the retry
      // submitted the other change. If that happens, when the user retries, they will not get the
      // meta ref updates for the change that got submitted on the previous submission attempt.
      // Ideally, submit should be idempotent and always return all meta refs on all submission
      // attempts.
      assertThat(headers)
          .containsExactly(
              String.format(
                  "%s~%s~%s~%s",
                  Url.encode(project.get()),
                  Url.encode(metaRef1),
                  originalFirstMetaRefSha1.getName(),
                  firstMetaRefSha1.getName()),
              String.format(
                  "%s~%s~%s~%s",
                  Url.encode(project.get()),
                  Url.encode(metaRef2),
                  originalSecondMetaRefSha1.getName(),
                  secondMetaRefSha1.getName()),
              String.format(
                  "%s~%s~%s~%s",
                  Url.encode(project.get()),
                  Url.encode(branch),
                  originalDestinationBranchSha1.getName(),
                  branchSha1));
    }
  }

  private ObjectId getMetaRefSha1(Result change) {
    return change.getChange().notes().getRevision();
  }

  private RestResponse prettyJsonRestResponse(String ppArgument, int ppValue) throws Exception {
    RestResponse response =
        adminRestSession.getWithHeaders(
            ANY_REST_API + "?" + ppArgument + "=" + ppValue, ACCEPT_STAR_HEADER);
    assertThat(response.getStatusCode()).isEqualTo(SC_OK);

    return response;
  }

  private String contentWithoutMagicJson(RestResponse response) throws IOException {
    return response.getEntityContent().substring(RestApiServlet.JSON_MAGIC.length);
  }
}
