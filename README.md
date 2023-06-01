# Legacy Open Nettest Public Portal

## Installation

The project requires Node.js 7.x or later.

Run:

```sh
$ sudo npm -g install grunt-cli bower
$ npm install --legacy-peer-deps
$ bower install
```

## Compilation

Configure your customer parameters in the `customer/nettest` folder.

Then compile the code with:

```sh
$ grunt watch --customer=nettest --env=<environment>
```

Use `--force` if there are lint errors.

The `build` folder will contain the compiled files.

The script will watch for changes in the source code and update the compiled files accordingly. If you don't need this, use `grunt build` instead of `grunt watch`.


## Running locally

Use `npm run start` to serve the compiled files locally on port `3000`.

## Adding customer and customer dependent .adoc files

A customer settings file must be created in the `customers/` folder.

All files in the `customers/{customer_name}/views/` files are treated as if they were in the `src/app/views/` folder. The desired customer's files are compiled and published only.

Language dependent files are also placed here. These files are automatically converted to HTML and copied to the correct place inside the `build` directory.

## Deployment

```sh
grunt deploy --customer=nettest --env=test --obfuscator
```

This will create and deploy a `bin` folder with the compiled and minified files. You can set up the deployment parameters in `customers/nettest/deploy.config.js`

To fetch translations from Transifex, please run

```sh
grunt fetch-translations
```

To persist your Transifex credentials, please create a `.transifexrc` file with credentials in format: `{"user":"user","pass":"pass"}`

To fetch translations while deploying, please add `--fetch-translations` flag

To specify ssh private key passphrase, please add `--passphrase=pwd`

## Additional
 - [SSR setup](documentation/SSR.md)
