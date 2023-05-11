// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";

// ----- Libs
import axios from "axios";

// List of Lens subgraphs to check
// Replace these with actual Lens URLs
export const lensSubgraphs = [
  "https://api.thegraph.com/subgraphs/name/lens-xyz/lens",
  "https://api.thegraph.com/subgraphs/name/lens-xyz/lens-xdai",
];

// Compute the minimum required token age as milliseconds
const minTokenAge = 15 * 24 * 3600000;

// Defining interfaces for the data structure returned by the subgraph
// Replace these with actual Lens data structures
interface Token {
  id: string;
  created: number; // Number of seconds since start of epoch
}

interface Account {
  tokens: Array<Token>;
}

interface DataAccount {
  account: Account;
}

interface Data {
  data: DataAccount;
}

interface Result {
  data: Data;
}

type LensCheckResult = {
  hasTokens: boolean;
  tokenList: string[];
};

// Export a Lens Provider
export class LensProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Lens";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in owns at least one Lens token older than 15 days
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address;
    let lensCheckResult = {
      hasTokens: false,
      tokenList: null as string[],
    };

    async function checkForTokens(url: string): Promise<LensCheckResult> {
      let hasTokens = false;
      let tokenList = null as string[];
      const result = await axios.post(url, {
        query: `
          {
            account(id: "${address}") {
              tokens(orderBy: created, orderDirection: asc) {
                id
                created
              }
            }
          }
          `,
      });

      const r = result as Result;
      const tokens = r?.data?.data?.account?.tokens || [];

      if (tokens.length > 0) {
        // If at least one token is present, check the oldest one
        const oldestToken = tokens[0];
        const age = Date.now() - oldestToken.created * 1000;
        hasTokens = age > minTokenAge;
        if (hasTokens) {
          tokenList = tokens.map((token) => token.id);
        }
      }

      // Return false by default (if tokens array is empty or no matching verification)
      return {
        hasTokens,
        tokenList,
      };
    }

    // Verify if the user has tokens on all supported networks
    for (let i = 0; !lensCheckResult.hasTokens && i < lensSubgraphs.length; i++) {
      lensCheckResult = await checkForTokens(lensSubgraphs[i]);    }

    return Promise.resolve({
      valid: lensCheckResult.hasTokens,
      record: {
        tokens: lensCheckResult.tokenList ? lensCheckResult.tokenList.join(",") : undefined,
      },
    });
  }
}

