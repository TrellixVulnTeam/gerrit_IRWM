#!/bin/bash
# Copyright (C) 2021 The Android Open Source Project
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
usage() {
  f="$(basename -- $0)"
  cat <<EOF
Usage:
    cd /path/to/All-Users.git
    "$f [username|gerrit]"

This script finds duplicate usernames only differing in case in the given
account schema ("username" or "gerrit") and their respective accountIds.
EOF
  exit 1
}

if [[ "$#" -ne "1" ]] || ! [[ "$1" =~ ^(gerrit|username)$ ]]; then
  usage
fi

# find lines with user name and subsequent line in external-ids notes branch
# remove group separators
# remove line break between user name and accountId lines
# unify separators to ":"
# cut on ":", select username and accountId fields
# sort case-insensitive
# flip columns
# uniq case-insensitive, only show duplicates, avoid comparing first field
# flip columns back
git grep -A1 "\[externalId \"$1:" refs/meta/external-ids \
  | sed -E "/$1/,/accountId/!d" \
  | paste -d ' ' - - \
  | tr \"= : \
  | cut -d: --output-delimiter="" -f 5,8 \
  | sort -f \
  | sed -E "s/(.*) (.*)/\2 \1/" \
  | uniq -Di -f1 \
  | sed -E "s/(.*) (.*)/\2 \1/"
