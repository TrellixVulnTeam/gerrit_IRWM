// Copyright (C) 2015 The Android Open Source Project
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

package com.google.gerrit.index.query;

import org.junit.Ignore;

@Ignore
public abstract class PredicateTest {
  @SuppressWarnings("ProtectedMembersInFinalClass")
  protected static final class TestMatchablePredicate extends TestPredicate
      implements Matchable<String> {
    protected int cost;
    protected boolean ranMatch = false;

    protected TestMatchablePredicate(String name, String value, int cost) {
      super(name, value);
      this.cost = cost;
    }

    @Override
    public boolean match(String object) {
      ranMatch = true;
      return false;
    }

    @Override
    public int getCost() {
      return cost;
    }
  }

  protected static class TestPredicate extends OperatorPredicate<String> {
    private TestPredicate(String name, String value) {
      super(name, value);
    }
  }

  protected static TestPredicate f(String name, String value) {
    return new TestPredicate(name, value);
  }
}
