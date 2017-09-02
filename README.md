# web-map-utils

A JavaScript library to help with web map tasks that are not handled by the JSAPI (such as serializing a map object to web map JSON).

> **NOTE:** This was a work in progress, only partially supports serializing a map object, and is [no longer actively maintained](https://github.com/tomwayson/web-map-utils/issues/2#issuecomment-326626990). If you find this useful, great, please feel free to use it. Pull requests gladly accepted.

### Install

I never got around to publishing this on any package manager, so for now it's clone, copy, and paste. Old skool!

### Development Instructions

After cloning or forking, install dependencies with:

```bash
npm install
```

To run tests contniously (i.e. TDD): 

```bash
karma start
```

To run tests one time (i.e. on CI server):

```bash
grunt test
```
