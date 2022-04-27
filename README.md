oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g extractwar
$ extractwar COMMAND
running command...
$ extractwar (--version)
extractwar/0.0.0 linux-x64 node-v15.2.1
$ extractwar --help [COMMAND]
USAGE
  $ extractwar COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`extractwar hello PERSON`](#extractwar-hello-person)
* [`extractwar hello world`](#extractwar-hello-world)
* [`extractwar help [COMMAND]`](#extractwar-help-command)
* [`extractwar plugins`](#extractwar-plugins)
* [`extractwar plugins:install PLUGIN...`](#extractwar-pluginsinstall-plugin)
* [`extractwar plugins:inspect PLUGIN...`](#extractwar-pluginsinspect-plugin)
* [`extractwar plugins:install PLUGIN...`](#extractwar-pluginsinstall-plugin-1)
* [`extractwar plugins:link PLUGIN`](#extractwar-pluginslink-plugin)
* [`extractwar plugins:uninstall PLUGIN...`](#extractwar-pluginsuninstall-plugin)
* [`extractwar plugins:uninstall PLUGIN...`](#extractwar-pluginsuninstall-plugin-1)
* [`extractwar plugins:uninstall PLUGIN...`](#extractwar-pluginsuninstall-plugin-2)
* [`extractwar plugins update`](#extractwar-plugins-update)

## `extractwar hello PERSON`

Say hello

```
USAGE
  $ extractwar hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Whom is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/captaintoucan/extractwar/blob/v0.0.0/dist/commands/hello/index.ts)_

## `extractwar hello world`

Say hello world

```
USAGE
  $ extractwar hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ oex hello world
  hello world! (./src/commands/hello/world.ts)
```

## `extractwar help [COMMAND]`

Display help for extractwar.

```
USAGE
  $ extractwar help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for extractwar.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `extractwar plugins`

List installed plugins.

```
USAGE
  $ extractwar plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ extractwar plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.0.11/src/commands/plugins/index.ts)_

## `extractwar plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ extractwar plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ extractwar plugins add

EXAMPLES
  $ extractwar plugins:install myplugin 

  $ extractwar plugins:install https://github.com/someuser/someplugin

  $ extractwar plugins:install someuser/someplugin
```

## `extractwar plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ extractwar plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ extractwar plugins:inspect myplugin
```

## `extractwar plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ extractwar plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ extractwar plugins add

EXAMPLES
  $ extractwar plugins:install myplugin 

  $ extractwar plugins:install https://github.com/someuser/someplugin

  $ extractwar plugins:install someuser/someplugin
```

## `extractwar plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ extractwar plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ extractwar plugins:link myplugin
```

## `extractwar plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ extractwar plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ extractwar plugins unlink
  $ extractwar plugins remove
```

## `extractwar plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ extractwar plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ extractwar plugins unlink
  $ extractwar plugins remove
```

## `extractwar plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ extractwar plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ extractwar plugins unlink
  $ extractwar plugins remove
```

## `extractwar plugins update`

Update installed plugins.

```
USAGE
  $ extractwar plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
