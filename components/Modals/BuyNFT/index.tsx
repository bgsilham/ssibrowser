import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import * as tyron from "tyron";
import {
  hideTxStatusModal,
  setTxId,
  setTxStatusLoading,
  showBuyNFTModal,
  showLoginModal,
  showTxStatusModal,
  updateLoginInfoUsername,
} from "../../../src/app/actions";
import { RootState } from "../../../src/app/reducers";
import CloseIcon from "../../../src/assets/icons/ic_cross.svg";
import InfoIcon from "../../../src/assets/icons/info_yellow.svg";
import styles from "./styles.module.scss";
import Image from "next/image";
import { $user } from "../../../src/store/user";
import { $net, updateNet } from "../../../src/store/wallet-network";
import { useStore } from "effector-react";
import * as zcrypto from "@zilliqa-js/crypto";
import { toast } from "react-toastify";
import { ZilPayBase } from "../../ZilPay/zilpay-base";
import { updateTxList } from "../../../src/store/transactions";
import { updateZilAddress } from "../../../src/store/zil_address";
import { updateDonation } from "../../../src/store/donation";
import { updateContract } from "../../../src/store/contract";
import { $buyInfo, updateBuyInfo } from "../../../src/store/buyInfo";
import { fetchAddr } from "../../SearchBar/utils";
import { AddFunds } from "../../";

function TransactionStatus() {
  const dispatch = useDispatch();
  const Router = useRouter();
  const user = useStore($user);
  const net = useStore($net);
  const buyInfo = useStore($buyInfo);
  const username = $user.getState()?.name;
  const modal = useSelector((state: RootState) => state.modal.buyNFTModal);
  const loginInfo = useSelector((state: RootState) => state.modal);
  const [addrID, setAddrID] = useState("");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [inputAddr, setInputAddr] = useState("");
  const [legend, setLegend] = useState("save");
  const [loading, setLoading] = useState(false);

  const handleOnChangeRecipient = (event: { target: { value: any } }) => {
    updateBuyInfo({ recipientOpt: event.target.value });
  };

  const handleConnect = React.useCallback(async () => {
    try {
      const wallet = new ZilPayBase();
      const zp = await wallet.zilpay();
      const connected = await zp.wallet.connect();

      const network = zp.wallet.net;
      updateNet(network);

      if (connected && zp.wallet.defaultAccount) {
        const address = zp.wallet.defaultAccount;
        updateZilAddress(address);
        dispatch(showLoginModal(true));
      }

      const cache = window.localStorage.getItem(
        String(zp.wallet.defaultAccount?.base16)
      );
      if (cache) {
        updateTxList(JSON.parse(cache));
      }
    } catch (err) {
      toast.error(String(err), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }, [dispatch]);

  const handleInputAddr = (event: { target: { value: any } }) => {
    setInputAddr("");
    setLegend("save");
    let value = event.target.value;
    try {
      value = zcrypto.fromBech32Address(value);
      setInputAddr(value);
    } catch (error) {
      try {
        value = zcrypto.toChecksumAddress(value);
        setInputAddr(value);
      } catch {
        toast.error(`Wrong address.`, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          toastId: 5,
        });
      }
    }
  };

  const handleOnKeyPress = ({ key }: React.KeyboardEvent<HTMLInputElement>) => {
    if (key === "Enter") {
      validateInputAddr();
    }
  };

  const validateInputAddr = () => {
    try {
      zcrypto.fromBech32Address(inputAddr);
      setLegend("saved");
    } catch (error) {
      try {
        zcrypto.toChecksumAddress(inputAddr);
        setLegend("saved");
      } catch {
        toast.error(`Wrong address.`, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          toastId: 5,
        });
      }
    }
  };

  const handleOnChangePayment = async (event: { target: { value: any } }) => {
    setAddrID("");
    updateDonation(null);
    setLoadingBalance(true);

    const selection = event.target.value;
    updateBuyInfo({
      recipientOpt: buyInfo?.recipientOpt,
      currency: selection,
      currentBalance: 0,
      isEnough: false,
    });
    updateContract({ addr: loginInfo.address });

    const paymentOptions = async (id: string) => {
      let token_addr: string;
      let network = tyron.DidScheme.NetworkNamespace.Mainnet;
      if (net === "testnet") {
        network = tyron.DidScheme.NetworkNamespace.Testnet;
      }
      const init = new tyron.ZilliqaInit.default(network);
      const init_addr = await fetchAddr({
        net,
        _username: "init",
        _domain: "did",
      });
      const get_services = await init.API.blockchain.getSmartContractSubState(
        init_addr,
        "services"
      );
      const services = await tyron.SmartUtil.default.intoMap(
        get_services.result.services
      );
      try {
        token_addr = services.get(id.toLowerCase());
        const balances = await init.API.blockchain.getSmartContractSubState(
          token_addr,
          "balances"
        );
        const balances_ = await tyron.SmartUtil.default.intoMap(
          balances.result.balances
        );

        try {
          const balance = balances_.get(loginInfo.address.toLowerCase());
          if (balance !== undefined) {
            updateBuyInfo({
              recipientOpt: buyInfo?.recipientOpt,
              currency: selection,
              currentBalance: balance,
            });
            if (balance >= 10e12) {
              updateBuyInfo({
                recipientOpt: buyInfo?.recipientOpt,
                currency: selection,
                currentBalance: balance,
                isEnough: true,
              }); // @todo-i this condition depends on the cost per currency
            }
          }
        } catch (error) {
          // @todo-i improve error handling => balances_.get(addr.toLowerCase()) returns an error when the addr is not in balances_
        }
      } catch (error) {
        toast.error("Not able to fetch balance.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      setLoadingBalance(false);
    };
    let addrId = "free00";
    switch (selection) {
      case "TYRON":
        addrId = "tyron0";
        break;
      case "$SI":
        addrId = "$si000";
        break;
      case "XSGD":
        addrId = "xsgd00";
        break;
      case "zUSDT":
        addrId = "zusdt0";
        break;
      case "PIL":
        addrId = "pil000";
        break;
      case "PIL":
        addrId = "pil000";
        break;
    }
    if (addrId !== "free00") {
      paymentOptions(addrId);
    }
    setAddrID(addrId);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const zilpay = new ZilPayBase();
      const tx_params = Array();

      const username_ = addrID.concat(username!);
      const tx_username = {
        vname: "username",
        type: "String",
        value: username_,
      };
      tx_params.push(tx_username);
      /*
      const id_ = {
        vname: "id",
        type: "String",
        value: id,
      };
      tx_params.push(id_);*/

      let addr: tyron.TyronZil.TransitionValue;
      if (buyInfo?.recipientOpt === "ADDR") {
        addr = await tyron.TyronZil.default.OptionParam(
          tyron.TyronZil.Option.some,
          "ByStr20",
          inputAddr
        );
      } else {
        addr = await tyron.TyronZil.default.OptionParam(
          tyron.TyronZil.Option.none,
          "ByStr20"
        );
      }

      const tx_addr = {
        vname: "addr",
        type: "Option ByStr20",
        value: addr,
      };
      tx_params.push(tx_addr);

      let _amount = String(0);
      /*
      let tx_amount = {
        vname: "amount",
        type: "Uint128",
        value: "0",
      };
      tx_params.push(tx_amount);*/

      let tyron_ = await tyron.TyronZil.default.OptionParam(
        tyron.TyronZil.Option.none,
        "Uint128"
      );
      const tx_tyron = {
        vname: "tyron",
        type: "Option Uint128",
        value: tyron_,
      };
      tx_params.push(tx_tyron);

      let tx = await tyron.Init.default.transaction(net);

      toast.info(`You're about to buy the NFT Username ${username}!`, {
        position: "top-center",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      dispatch(showBuyNFTModal(false));
      resetState();
      dispatch(setTxStatusLoading("true"));
      dispatch(showTxStatusModal());
      await zilpay
        .call({
          contractAddress: loginInfo.address,
          transition: "BuyNftUsername",
          params: tx_params,
          amount: _amount,
        })
        .then(async (res) => {
          dispatch(setTxId(res.ID));
          dispatch(setTxStatusLoading("submitted"));

          tx = await tx.confirm(res.ID);
          if (tx.isConfirmed()) {
            dispatch(setTxStatusLoading("confirmed"));
            setTimeout(() => {
              window.open(
                `https://devex.zilliqa.com/tx/${res.ID}?network=https%3A%2F%2F${
                  net === "mainnet" ? "" : "dev-"
                }api.zilliqa.com`
              );
            }, 1000);
            dispatch(updateLoginInfoUsername(username!)); // @todo-i make sure the dashboard modal updates with the new username
            Router.push(`/${username}`);
          } else if (tx.isRejected()) {
            dispatch(setTxStatusLoading("failed"));
          }
          updateDonation(null);
        })
        .catch((err) => {
          dispatch(hideTxStatusModal());
          toast.error(String(err), {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
        });
    } catch (error) {
      dispatch(hideTxStatusModal());
      toast.error(String(error), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
    setLoading(false);
  };

  const resetState = () => {
    setInputAddr("");
    updateBuyInfo({
      recipientOpt: "",
      currency: "",
      currentBalance: 0,
      isEnough: false,
    });
  };

  const spinner = (
    <i className="fa fa-lg fa-spin fa-circle-notch" aria-hidden="true"></i>
  );

  if (!modal) {
    return null;
  }

  return (
    <>
      <div className={styles.outerWrapper}>
        <div className={styles.container}>
          <div className={styles.innerContainer}>
            <div className={styles.closeIcon}>
              <Image
                alt="close-ico"
                src={CloseIcon}
                onClick={() => dispatch(showBuyNFTModal(false))}
              />
            </div>
            <div className={styles.contentWrapper}>
              <h3 className={styles.headerInfo}>buy this nft username</h3>
              <div className={styles.usernameInfoWrapper}>
                <h2 className={styles.usernameInfoYellow}>{user?.name}</h2>
                <h2 className={styles.usernameInfo}>&nbsp;is available</h2>
              </div>
              {loginInfo.address === null ? (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <p style={{ marginTop: "1%" }}>To continue:&nbsp;</p>
                  <button className="button" onClick={handleConnect}>
                    <p>CONNECT</p>
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "14px" }}>
                    You have logged in with the following SSI:
                  </p>
                  <p className={styles.loginAddress}>
                    {loginInfo.address !== null ? (
                      <>
                        {loginInfo.username ? (
                          `${loginInfo.username}.did`
                        ) : (
                          <a
                            className={styles.x}
                            href={`https://devex.zilliqa.com/address/${
                              loginInfo.address
                            }?network=https%3A%2F%2F${
                              net === "mainnet" ? "" : "dev-"
                            }api.zilliqa.com`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <span className={styles.x}>
                              {zcrypto.toBech32Address(loginInfo.address)}
                            </span>
                          </a>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </p>
                  <div className={styles.selectWrapper}>
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex" }}>
                        <p style={{ fontSize: "20px" }}>Select recipient</p>
                        <div className={styles.icoInfo}>
                          <Image alt="info-ico" src={InfoIcon} />{" "}
                          {/** @todo-i add info: ""*/}
                        </div>
                      </div>
                      <select
                        className={styles.select}
                        onChange={handleOnChangeRecipient}
                      >
                        <option value=""></option>
                        <option value="SSI">This SSI</option>
                        <option value="ADDR">Another address</option>
                      </select>
                    </div>
                    <div className={styles.paymentWrapper}>
                      {buyInfo?.recipientOpt === "SSI" ||
                      (buyInfo?.recipientOpt === "ADDR" && inputAddr !== "") ? (
                        <>
                          <div style={{ display: "flex" }}>
                            <p style={{ fontSize: "20px" }}>Select payment</p>
                          </div>
                          <select
                            className={styles.select}
                            onChange={handleOnChangePayment}
                          >
                            <option value=""></option>
                            <option value="TYRON">10 TYRON</option>
                            <option value="$SI">10 $SI</option>
                            <option value="zUSDT">10 zUSDT</option>
                            <option value="XSGD">14 XSGD</option>
                            <option value="PIL">12 PIL</option>
                            <option value="FREE">Free</option>
                          </select>
                        </>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                  {buyInfo?.recipientOpt == "ADDR" && (
                    <div className={styles.inputAddrWrapper}>
                      <input
                        type="text"
                        style={{ marginRight: "3%" }}
                        onChange={handleInputAddr}
                        onKeyPress={handleOnKeyPress}
                        placeholder="Type address"
                        autoFocus
                      />
                      <button
                        onClick={validateInputAddr}
                        className={
                          legend === "save"
                            ? "button primary"
                            : "button secondary"
                        }
                      >
                        <p>{legend}</p>
                      </button>
                    </div>
                  )}
                  {buyInfo?.currency !== undefined && (
                    <>
                      <div className={styles.balanceInfoWrapepr}>
                        <p className={styles.balanceInfo}>
                          Your SSI has a current balance of
                        </p>
                        {loadingBalance ? (
                          <div style={{ marginLeft: "2%" }}>{spinner}</div>
                        ) : (
                          <p className={styles.balanceInfoYellow}>
                            &nbsp;{buyInfo?.currentBalance / 1e12}{" "}
                            {buyInfo?.currency}
                          </p>
                        )}
                      </div>
                      {buyInfo?.currency !== "" && !loadingBalance && (
                        <>
                          {buyInfo?.isEnough ? (
                            <>
                              <div
                                style={{
                                  width: "fit-content",
                                  marginTop: "10%",
                                  textAlign: "center",
                                }}
                              >
                                <button
                                  className="button"
                                  onClick={handleSubmit}
                                >
                                  <strong style={{ color: "#ffff32" }}>
                                    {loading ? spinner : "BUY NFT USERNAME"}
                                  </strong>
                                </button>
                              </div>
                              <h5
                                style={{ marginTop: "3%", color: "lightgrey" }}
                              >
                                Gas AROUND 13 ZIL
                              </h5>
                            </>
                          ) : (
                            <>
                              <p style={{ color: "red" }}>
                                Not enough balance to buy an NFT username
                              </p>
                              <AddFunds type="buy" coin={buyInfo?.currency} />
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TransactionStatus;