
async function shouldFailWithMessage (promise, message) {
  try {
    await promise;
  } catch (error) {
    if (message) {
      assert.isTrue(error.message.includes(message),`Wrong failure type, expected '${message}' but got '${error.message}'`);
    }
    return;
  }

  assert.fail('Expected failure not received');
}

async function reverting (promise) {
  await shouldFailWithMessage(promise, 'revert');
}

async function throwing (promise) {
  await shouldFailWithMessage(promise, 'invalid opcode');
}

async function outOfGas (promise) {
  await shouldFailWithMessage(promise, 'out of gas');
}

async function shouldFail (promise) {
  await shouldFailWithMessage(promise);
}

async function revertWithMessage(promise, message) {
  await shouldFailWithMessage(promise, message);
}

shouldFail.reverting = reverting;
shouldFail.throwing = throwing;
shouldFail.outOfGas = outOfGas;
shouldFail.revertWithMessage = revertWithMessage;

module.exports = shouldFail;
