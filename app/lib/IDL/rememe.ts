export type Rememe = {
  version: "0.1.0";
  name: "rememe";
  instructions: [
    {
      name: "initializeConfig";
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: false;
        },
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "initializePool";
      accounts: [
        {
          name: "config";
          isMut: false;
          isSigner: false;
        },
        {
          name: "creator";
          isMut: true;
          isSigner: true;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "quoteMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "quoteVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidTokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "initializeEscrow";
      accounts: [
        {
          name: "config";
          isMut: false;
          isSigner: false;
        },
        {
          name: "creator";
          isMut: true;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "cpiProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "topStakerList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fullBalanceList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "stake";
      accounts: [
        {
          name: "staker";
          isMut: true;
          isSigner: true;
        },
        {
          name: "liquidStakingPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
          docs: ["CHECK"];
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidTokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakerTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakerLiquidTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lookupTable";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cpiProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "topStakerList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fullBalanceList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "smallestStakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lockEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrowVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "requestUnstake";
      accounts: [
        {
          name: "staker";
          isMut: true;
          isSigner: true;
        },
        {
          name: "liquidStakingPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: false;
          docs: ["CHECK"];
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidTokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakerLiquidTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lstUnstakeRequest";
          isMut: true;
          isSigner: true;
        },
        {
          name: "lookupTable";
          isMut: false;
          isSigner: false;
        },
        {
          name: "unstake";
          isMut: true;
          isSigner: true;
        },
        {
          name: "cpiProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "topStakerList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fullBalanceList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lockEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrowVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "withdraw";
      accounts: [
        {
          name: "staker";
          isMut: true;
          isSigner: true;
        },
        {
          name: "liquidStakingPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: false;
          docs: ["CHECK"];
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakerTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lstUnstakeRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "unstake";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cpiProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "eventAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "cancelUnstake";
      accounts: [
        {
          name: "staker";
          isMut: true;
          isSigner: true;
        },
        {
          name: "liquidStakingPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: false;
          docs: ["CHECK"];
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidTokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakerLiquidTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lstUnstakeRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "unstake";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lookupTable";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cpiProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "topStakerList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fullBalanceList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "smallestStakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lockEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrowVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "claimFees";
      accounts: [
        {
          name: "staker";
          isMut: true;
          isSigner: true;
        },
        {
          name: "liquidStakingPool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
          docs: ["CHECK"];
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidPoolQuoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lookupTable";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cpiProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "topStakerList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fullBalanceList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "smallestStakeEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lockEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrowVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "createAddressLookupTable";
      accounts: [
        {
          name: "signer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lookupTable";
          isMut: true;
          isSigner: false;
        },
        {
          name: "addressLookupTableProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "extendAddressLookupTable";
      accounts: [
        {
          name: "signer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lookupTable";
          isMut: true;
          isSigner: false;
        },
        {
          name: "newAddress";
          isMut: false;
          isSigner: false;
        },
        {
          name: "addressLookupTableProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "config";
      type: {
        kind: "struct";
        fields: [
          {
            name: "creatorAuthority";
            type: "publicKey";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "padding";
            type: {
              array: ["u8", 32];
            };
          }
        ];
      };
    },
    {
      name: "liquidStakingPool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "vault";
            type: "publicKey";
          },
          {
            name: "tokenMint";
            type: "publicKey";
          },
          {
            name: "escrow";
            type: "publicKey";
          },
          {
            name: "tokenVaultAccount";
            type: "publicKey";
          },
          {
            name: "tokenMintDecimals";
            type: "u8";
          },
          {
            name: "quoteVaultAccount";
            type: "publicKey";
          },
          {
            name: "poolCreator";
            type: "publicKey";
          },
          {
            name: "liquidTokenMint";
            type: "publicKey";
          },
          {
            name: "liquidTokenVault";
            type: "publicKey";
          },
          {
            name: "liquidSupply";
            type: "u64";
          },
          {
            name: "lut";
            type: "publicKey";
          },
          {
            name: "depositFeeRate";
            type: "u64";
          },
          {
            name: "rewardFeeRate";
            type: "u64";
          },
          {
            name: "protocolFeesToken";
            type: "u64";
          },
          {
            name: "protocolFeesQuote";
            type: "u64";
          },
          {
            name: "recentEpoch";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "authBump";
            type: "u8";
          },
          {
            name: "status";
            type: "u8";
          },
          {
            name: "padding";
            type: {
              array: ["u64", 64];
            };
          }
        ];
      };
    },
    {
      name: "lstUnstakeRequest";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "publicKey";
          },
          {
            name: "unstake";
            type: "publicKey";
          },
          {
            name: "padding";
            type: {
              array: ["u64", 20];
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "LiquidStakingPoolStatusBitIndex";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Deposit";
          },
          {
            name: "Withdraw";
          }
        ];
      };
    },
    {
      name: "LiquidStakingPoolStatusBitFlag";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Enable";
          },
          {
            name: "Disable";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "NotApproved";
      msg: "Not approved";
    },
    {
      code: 6001;
      name: "InvalidOwner";
      msg: "Input account owner is not the program address";
    },
    {
      code: 6002;
      name: "InvalidCpiProgram";
      msg: "Invalid cpi program";
    },
    {
      code: 6003;
      name: "InvalidInput";
      msg: "Invalid input";
    },
    {
      code: 6004;
      name: "EscrowAlreadyInitialized";
      msg: "Escrow already initialized";
    },
    {
      code: 6005;
      name: "AccountBorrowFailed";
      msg: "Account borrow failed";
    },
    {
      code: 6006;
      name: "AccountDeserializeFailed";
      msg: "Account deserialize failed";
    },
    {
      code: 6007;
      name: "InvalidLiquidStakingTokenVault";
      msg: "Invalid liquid staking token vault";
    },
    {
      code: 6008;
      name: "InvalidLiquidStakingTokenMint";
      msg: "Invalid liquid staking token mint";
    },
    {
      code: 6009;
      name: "InvalidLiquidStakingTokenOwner";
      msg: "Invalid liquid staking token owner";
    },
    {
      code: 6010;
      name: "StakedSupplyIsZero";
      msg: "Liquid staking supply is zero";
    },
    {
      code: 6011;
      name: "InvalidUnstakeRequestOwner";
      msg: "Invalid unstake request owner";
    },
    {
      code: 6012;
      name: "InvalidUnstakeRequestUnstake";
      msg: "Invalid unstake request unstake";
    },
    {
      code: 6013;
      name: "CreateLookupTableFailed";
      msg: "Create lookup table failed";
    },
    {
      code: 6014;
      name: "InvalidLookupTable";
      msg: "Invalid lookup table";
    },
    {
      code: 6015;
      name: "InvalidNumberOfAccounts";
      msg: "Invalid number of accounts";
    },
    {
      code: 6016;
      name: "OverflowError";
      msg: "Overflow error";
    },
    {
      code: 6017;
      name: "DivisionError";
      msg: "Division error";
    },
    {
      code: 6018;
      name: "InsufficientLiquidStakingToken";
      msg: "Insufficient liquid staking token";
    }
  ];
};

export const IDL: Rememe = {
  version: "0.1.0",
  name: "rememe",
  instructions: [
    {
      name: "initializeConfig",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false,
        },
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initializePool",
      accounts: [
        {
          name: "config",
          isMut: false,
          isSigner: false,
        },
        {
          name: "creator",
          isMut: true,
          isSigner: true,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "quoteMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "quoteVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidTokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initializeEscrow",
      accounts: [
        {
          name: "config",
          isMut: false,
          isSigner: false,
        },
        {
          name: "creator",
          isMut: true,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "cpiProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "topStakerList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fullBalanceList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "stake",
      accounts: [
        {
          name: "staker",
          isMut: true,
          isSigner: true,
        },
        {
          name: "liquidStakingPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
          docs: ["CHECK"],
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidTokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakerTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakerLiquidTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lookupTable",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cpiProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "topStakerList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fullBalanceList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "smallestStakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lockEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "requestUnstake",
      accounts: [
        {
          name: "staker",
          isMut: true,
          isSigner: true,
        },
        {
          name: "liquidStakingPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: false,
          docs: ["CHECK"],
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidTokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakerLiquidTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lstUnstakeRequest",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lookupTable",
          isMut: false,
          isSigner: false,
        },
        {
          name: "unstake",
          isMut: true,
          isSigner: true,
        },
        {
          name: "cpiProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "topStakerList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fullBalanceList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lockEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "withdraw",
      accounts: [
        {
          name: "staker",
          isMut: true,
          isSigner: true,
        },
        {
          name: "liquidStakingPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: false,
          docs: ["CHECK"],
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakerTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lstUnstakeRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "unstake",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cpiProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "eventAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "cancelUnstake",
      accounts: [
        {
          name: "staker",
          isMut: true,
          isSigner: true,
        },
        {
          name: "liquidStakingPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: false,
          docs: ["CHECK"],
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidTokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakerLiquidTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lstUnstakeRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "unstake",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lookupTable",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cpiProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "topStakerList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fullBalanceList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "smallestStakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lockEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "claimFees",
      accounts: [
        {
          name: "staker",
          isMut: true,
          isSigner: true,
        },
        {
          name: "liquidStakingPool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
          docs: ["CHECK"],
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidPoolQuoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lookupTable",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cpiProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "topStakerList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fullBalanceList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "smallestStakeEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lockEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "createAddressLookupTable",
      accounts: [
        {
          name: "signer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lookupTable",
          isMut: true,
          isSigner: false,
        },
        {
          name: "addressLookupTableProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "extendAddressLookupTable",
      accounts: [
        {
          name: "signer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lookupTable",
          isMut: true,
          isSigner: false,
        },
        {
          name: "newAddress",
          isMut: false,
          isSigner: false,
        },
        {
          name: "addressLookupTableProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "config",
      type: {
        kind: "struct",
        fields: [
          {
            name: "creatorAuthority",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "padding",
            type: {
              array: ["u8", 32],
            },
          },
        ],
      },
    },
    {
      name: "liquidStakingPool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "vault",
            type: "publicKey",
          },
          {
            name: "tokenMint",
            type: "publicKey",
          },
          {
            name: "escrow",
            type: "publicKey",
          },
          {
            name: "tokenVaultAccount",
            type: "publicKey",
          },
          {
            name: "tokenMintDecimals",
            type: "u8",
          },
          {
            name: "quoteVaultAccount",
            type: "publicKey",
          },
          {
            name: "poolCreator",
            type: "publicKey",
          },
          {
            name: "liquidTokenMint",
            type: "publicKey",
          },
          {
            name: "liquidTokenVault",
            type: "publicKey",
          },
          {
            name: "liquidSupply",
            type: "u64",
          },
          {
            name: "lut",
            type: "publicKey",
          },
          {
            name: "depositFeeRate",
            type: "u64",
          },
          {
            name: "rewardFeeRate",
            type: "u64",
          },
          {
            name: "protocolFeesToken",
            type: "u64",
          },
          {
            name: "protocolFeesQuote",
            type: "u64",
          },
          {
            name: "recentEpoch",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "authBump",
            type: "u8",
          },
          {
            name: "status",
            type: "u8",
          },
          {
            name: "padding",
            type: {
              array: ["u64", 64],
            },
          },
        ],
      },
    },
    {
      name: "lstUnstakeRequest",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey",
          },
          {
            name: "unstake",
            type: "publicKey",
          },
          {
            name: "padding",
            type: {
              array: ["u64", 20],
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "LiquidStakingPoolStatusBitIndex",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Deposit",
          },
          {
            name: "Withdraw",
          },
        ],
      },
    },
    {
      name: "LiquidStakingPoolStatusBitFlag",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Enable",
          },
          {
            name: "Disable",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "NotApproved",
      msg: "Not approved",
    },
    {
      code: 6001,
      name: "InvalidOwner",
      msg: "Input account owner is not the program address",
    },
    {
      code: 6002,
      name: "InvalidCpiProgram",
      msg: "Invalid cpi program",
    },
    {
      code: 6003,
      name: "InvalidInput",
      msg: "Invalid input",
    },
    {
      code: 6004,
      name: "EscrowAlreadyInitialized",
      msg: "Escrow already initialized",
    },
    {
      code: 6005,
      name: "AccountBorrowFailed",
      msg: "Account borrow failed",
    },
    {
      code: 6006,
      name: "AccountDeserializeFailed",
      msg: "Account deserialize failed",
    },
    {
      code: 6007,
      name: "InvalidLiquidStakingTokenVault",
      msg: "Invalid liquid staking token vault",
    },
    {
      code: 6008,
      name: "InvalidLiquidStakingTokenMint",
      msg: "Invalid liquid staking token mint",
    },
    {
      code: 6009,
      name: "InvalidLiquidStakingTokenOwner",
      msg: "Invalid liquid staking token owner",
    },
    {
      code: 6010,
      name: "StakedSupplyIsZero",
      msg: "Liquid staking supply is zero",
    },
    {
      code: 6011,
      name: "InvalidUnstakeRequestOwner",
      msg: "Invalid unstake request owner",
    },
    {
      code: 6012,
      name: "InvalidUnstakeRequestUnstake",
      msg: "Invalid unstake request unstake",
    },
    {
      code: 6013,
      name: "CreateLookupTableFailed",
      msg: "Create lookup table failed",
    },
    {
      code: 6014,
      name: "InvalidLookupTable",
      msg: "Invalid lookup table",
    },
    {
      code: 6015,
      name: "InvalidNumberOfAccounts",
      msg: "Invalid number of accounts",
    },
    {
      code: 6016,
      name: "OverflowError",
      msg: "Overflow error",
    },
    {
      code: 6017,
      name: "DivisionError",
      msg: "Division error",
    },
    {
      code: 6018,
      name: "InsufficientLiquidStakingToken",
      msg: "Insufficient liquid staking token",
    },
  ],
};
