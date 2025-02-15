// --- React Methods
import React, { useContext } from "react";

// --- Identity tools
import { PROVIDER_ID } from "@dpopp/types";
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// pull context
import { UserContext } from "../../context/userContext";

import { Card } from "../Card";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "LENS";

export default function LensCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  // fetch an example VC from the IAM server
  const handleFetchCredential = (): void => {
    fetchVerifiableCredential(
      iamUrl,
      {
        address: address || "",
        type: providerId,
        version: "0.0.0",
        proofs: {},
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((res): void => {
        handleAddStamp({
          provider: "LENS",
          credential: res.credential,
        });
      })
      .catch((e): void => {
        throw e;
      });
  };

  const issueCredentialWidget = (
    <button className="verify-btn" onClick={handleFetchCredential}>
      Verify
    </button>
  );

  return
    (
    <Card
      providerSpec={allProvidersState[providerId].providerSpec}
      verifiableCredential={allProvidersState[providerId].stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
    />
  );
}
