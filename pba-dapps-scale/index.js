const { TypeRegistry, Enum } = require('@polkadot/types');

const registry = new TypeRegistry();

class SimpleEnum extends Enum {
  constructor(registry, value) {
    super(registry, {
      Empty: null,
      Number: 'u32'
    }, value);
  }
}

function simpleScaleCodec() {

    const empty = new SimpleEnum(registry, { Empty: null });
  const number = new SimpleEnum(registry, { Number: 42 });

  console.log('Encoded Empty:', empty.toU8a().toString('hex')); 
  console.log('Encoded Number:', number.toU8a().toString('hex')); 

  const decodedEmpty = new SimpleEnum(registry, Buffer.from('00', 'hex'));
  const decodedNumber = new SimpleEnum(registry, Buffer.from('01a8000000', 'hex'));

  console.log('Decoded Empty:', decodedEmpty.toJSON()); 
  console.log('Decoded Number:', decodedNumber.toJSON()); 
}

simpleScaleCodec();