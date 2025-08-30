import { TypeRegistry } from '@polkadot/types';
import { u8aToHex, hexToU8a } from '@polkadot/util';

interface MyStructData {
  id: number;
  name: string;
  friendIds: number[];
  event: {
    _void?: null;
    one?: string;
    many?: string[];
    allOrNothing?: boolean;
  };
}

  const customTypes = {
  Event: {
    _enum: [
      '_void',
      'one',
      'many',
      'allOrNothing'
    ]
  },
  MyStruct: {
    id: 'u32',
    name: 'String',
    friendIds: 'Vec<u32>',
    event: 'Event'
  },
};

const registry = new TypeRegistry();
registry.register(customTypes);

const data: MyStructData = {
  id: 10,
  name: 'hello pba',
  friendIds: [1, 2, 3],
  event: { many: ['foo', 'bar', 'baz'] },
};

const typeDef = registry.createType('MyStruct', data);
const encodedHex = u8aToHex(typeDef.toU8a());
console.log('Encoded:', encodedHex);

const decoded = registry.createType('MyStruct', hexToU8a(encodedHex));
console.log('Decoded:', decoded.toJSON());