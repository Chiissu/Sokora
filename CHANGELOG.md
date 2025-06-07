<!-- markdownlint-disable md024 -->
<!-- preserve old changelogs here -->
<!-- don't make multiline comments for the parser to work -->

# Sokora Changelog

## 0.3.0

### Added

#### New commands

- Added `/games rps` to play Rock, Paper, Scissors.
- Added `/math graph` to graphically represent a function.
- Added `/help variables` to show help with _Dynamic (variables)_.
- Added `/ping` to view bot ping and latency.
- Added `/embed` to create custom embeds.

#### Moderation

- Added the ability to `/moderation clear` messages for a single user.
- Added reason field to `/moderation unmute`.

#### Changelog

- Added older versions to the `/changelog` command.

#### About

- Added unique member count to `/about`.

#### Serverboard

- Added the ability for server owners to display an invite link to their servers from the serverboard.

#### Starboard

- Added a starboard. It can be configured from `/settings starboard`.

#### Dynamic (variables)

- Gave a proper name to replaceable variables (`Dynamic (variables)`), and added more options:
- - `(serverowner)` - Server owner's name
- - `(currentdate)` - Current date in the 'July 10, 2025' format
- - `(currentdate, simple)` - Current date in the '7/10/25' format
- - `(currentdate, detailed)` - Current date in the 'July 10, 2025, at 1:11 PM' format

#### Easter eggs

- Added two new easter eggs.

### Changed

#### Settings

- Now settings display more readable embeds, by replacing `_` with whitespace, `true` / `false` with `Enabled` / `Disabled`, and formatting Dynamic (variables) into `code snippets`.

### Fixed

#### News

- Fixed not being able to delete the first new you create.

#### Moderation

- Fixed the bot crashing because of too large messages being deleted.
- Fixed a `Jump to message` option being shown on deleted messages (you cannot jump to a deleted message).
- Fixed the bot showing "Application didn't respond" when unmuting someone muted by another bot.
- Fixed the bot unable to send a moderation log when a deleted / edited message is too large. It will instead upload two text files containing old and new messages.

## 0.2.0

### Added

#### Commands

- `/changelog`
- `/credits`
- `/moderation notes`

### Changed

- The bot will remove levels when an admin changed the leveling difficulty
- Now `/leaderboard` shows 6 users per page instead of 5
- When you add the bot, it sends a message in the system channel
- Remade the message logs
- Edit logs will let you jump to the message that got edited

#### /settings

- Autocompletes with channels/users/roles (you don't have to copy IDs now :tada:)
- In the embed it will show links to channels/users/roles instead of showing IDs

#### /about

- Vote button added
- Moved credits into a different command to reduce the height of the embed

### Fixed

#### News

- Major issue related to the database, where the guild wasn't provided to ensure that news would be unique to every server, **thank you @Golem642!!!!**
- `/news` edit's modal errored when sending

#### Moderation commands

- `/moderation clear` removed one more message than the user provided
- `/moderation unban` errored internally (it should send an error embed) when the user didn\'t have the "Ban Members" permission

### Typos

- warn mentions in `/moderation warn` are now warning to be more consistent
- Removed old markdown remnants from `/moderation slowdown`

## 0.1.0

### Initial release :)
