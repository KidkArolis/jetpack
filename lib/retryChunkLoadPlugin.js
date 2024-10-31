const { RuntimeGlobals, RuntimeModule } = require('@rspack/core')

const name = 'RetryChunkLoadPlugin'

class RetryChunkLoadPlugin {
  #maxAttempts
  #base
  #multiplier

  constructor({ maxAttempts = 5, base = 1.8, multiplier = 500 } = {}) {
    if (typeof maxAttempts !== 'number' || maxAttempts < 1) {
      throw new Error('Invalid `maxAttempts`')
    }

    if (typeof base !== 'number' || base < 1) {
      throw new Error('Invalid `base`')
    }

    if (typeof multiplier !== 'number' || multiplier < 0) {
      throw new Error('Invalid `multiplier`')
    }

    this.#maxAttempts = maxAttempts
    this.#base = base
    this.#multiplier = multiplier
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(name, (compilation) => {
      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.ensureChunk).tap(name, (chunk, set) => {
        set.add(RuntimeGlobals.ensureChunk)
        const script = `
  var initialEnsureChunk = ${RuntimeGlobals.ensureChunk};

  ${RuntimeGlobals.ensureChunk} = function (chunkId) {
    var attemptCount = 0;

    return new Promise(function (resolve, reject) {
      var load = function () {
        initialEnsureChunk(chunkId).then((res) => resolve(res)).catch((e) => {
          if (++attemptCount >= ${this.#maxAttempts}) {
            reject(e);
          } else {
            setTimeout(() => load(), (${this.#base} ** (attemptCount - 1)) * ${this.#multiplier})
          }
        });
      };

      load();
    });
  };
`

        class CustomRuntimeModule extends RuntimeModule {
          constructor() {
            super('custom', RuntimeModule.STAGE_BASIC)
          }

          generate() {
            return script
          }
        }

        compilation.addRuntimeModule(chunk, new CustomRuntimeModule())
      })
    })
  }
}

module.exports = RetryChunkLoadPlugin
