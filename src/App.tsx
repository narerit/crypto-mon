import "./App.css";
import { Avatar, Card, Form, InputNumber, Statistic } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Table } from "antd";
import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
interface BinanceRes {
  s: string;
  p: string;
}
interface logType {
  key: React.Key;
  binance: number;
  aerodrome: string;
  difference: string;
  event: string;
  timeStamp: string;
}
const columns: TableColumnsType<logType> = [
  {
    title: "Count",
    dataIndex: "key",
    width: 100,
    fixed: "left",
  },
  {
    title: "Binance Price",
    dataIndex: "binance",
    width: 150,
  },
  {
    title: "Aerodrome Price",
    dataIndex: "aerodrome",
    width: 150,
  },
  {
    title: "Difference",
    dataIndex: "difference",
    width: 150,
  },
  {
    title: "Event",
    dataIndex: "event",
    width: 300,
  },
  {
    title: "TimeStamp",
    dataIndex: "timeStamp",
  },
];

const logArray: Array<logType> = [];
let logFlag: boolean = true;
let nextId = 1;
let aerodromePrice: number = 0.0;
const wallet = "0x4e962BB3889Bf030368F56810A9c96B83CB3E778";
const url =
  "https://api.geckoterminal.com/api/v2/networks/base/pools/" + wallet;
const App: React.FC = () => {
  const [binancePrice, setBinancePrice] = useState(0);
  const [diffPercent, setDiffPercent] = useState(0.0);
  const [diffColor, setDiffColor] = useState("#000000");
  const [diffIcon, setDiffIcon] = useState(<ArrowUpOutlined />);
  const [form] = Form.useForm();

  useEffect(() => {
    handleUpdate();
    const socket = new WebSocket(
      "wss:stream.binance.com:9443/ws/btcusdc@trade"
    );
    // Connection opened
    socket.addEventListener("open", () => {
      console.log("Connection established");
    });
    // Listen for messages
    socket.addEventListener("message", (event) => {
      const res: BinanceRes = JSON.parse(event.data);
      const price = parseFloat(res.p).toFixed(2);
      const currentPrice = parseFloat(price);

      checkPriceDiff(currentPrice);
    });
    //Implementing the setInterval method
    const interval = setInterval(() => {
      handleUpdate();
    }, 10 * 1000);

    //Clearing the interval
    return () => clearInterval(interval);
  }, []);
  const checkPriceDiff = (currentPrice: number) => {
    if (currentPrice > aerodromePrice) {
      setDiffColor("#3f8600");
      setDiffIcon(<ArrowUpOutlined />);
    } else if (currentPrice < aerodromePrice) {
      setDiffColor("#cf1322");
      setDiffIcon(<ArrowDownOutlined />);
    }
    const diff = currentPrice - aerodromePrice;
    const diffPercent = (diff * 100) / currentPrice;
    const absDiff = Math.abs(diffPercent);
    setBinancePrice(currentPrice);
    setDiffPercent(absDiff);
    const minDiff = form.getFieldValue("minDiff");
    const maxDiff = form.getFieldValue("maxDiff");
    if (absDiff >= maxDiff && !logFlag) {
      const data: logType = {
        key: nextId++,
        binance: currentPrice,
        aerodrome: aerodromePrice.toFixed(2),
        difference: absDiff.toFixed(2) + "%",
        event: "Difference above maximum threshold.",
        timeStamp: dayjs().format().replace("T", " ").split("+")[0],
      };
      logArray.splice(0, 0, data);
      logFlag = true;
    } else if (absDiff < minDiff && logFlag) {
      const data: logType = {
        key: nextId++,
        binance: currentPrice,
        aerodrome: aerodromePrice.toFixed(2),
        difference: absDiff.toFixed(2) + "%",
        event: "Difference under minimum threshold.",
        timeStamp: dayjs().format().replace("T", " ").split("+")[0],
      };
      logArray.splice(0, 0, data);
      logFlag = false;
    }
  };
  const handleUpdate = () => {
    axios.get(url).then((res) => {
      aerodromePrice = parseFloat(
        res.data.data.attributes.base_token_price_usd
      );
      console.log(res.data.data.attributes.base_token_price_usd);
    });
  };
  const different: JSX.Element = (
    <Statistic
      value={diffPercent}
      precision={2}
      valueStyle={{ color: diffColor }}
      prefix={diffIcon}
      suffix="%"
    />
  );
  const binanceUrl =
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg";
  const aeroDromeUrl = "https://aero.drome.eth.limo/brand-kit/token.svg";
  return (
    <div className="grid ml-6 lg:ml-8 lg:mr-8 lg:grid-cols-2">
      <div className="mt-8 lg:col-span-1">
        <Card
          title="CEX vs DEX Difference"
          className="w-96 lg:w-full lg:h-46"
          extra={different}
        >
          <div className="grid lg:grid-cols-2">
            <div className="flex items-center gap-2 xs:gap-4">
              <Avatar
                src={<img src={binanceUrl} alt="avatar" sizes="large" />}
              />
              <Statistic
                title="Binance (BTC/USD)"
                value={binancePrice}
                precision={2}
              />
            </div>
            <div className="flex items-center gap-2">
              {" "}
              <Avatar
                src={<img src={aeroDromeUrl} alt="avatar" sizes="large" />}
              />
              <Statistic
                title="Aerodrome (cbBTC/USDC)"
                value={aerodromePrice}
                precision={2}
              />
            </div>
          </div>
        </Card>
      </div>
      <div className="lg:ml-8 mt-8 lg:col-span-1">
        <Card title="Monitoring Config" className="w-96 lg:w-full lg:h-46">
          <Form
            layout={"vertical"}
            initialValues={{ minDiff: 1.0, maxDiff: 2.0 }}
            form={form}
            style={{ maxWidth: 600 }}
          >
            <div className="grid lg:flex gap-4">
              <Form.Item label="Difference threshold (min.)" name="minDiff">
                <InputNumber
                  precision={2}
                  step={0.01}
                  min={0}
                  placeholder="0"
                  suffix="%"
                  style={{ width: "max-content" }}
                />
              </Form.Item>
              <Form.Item label="Difference threshold (max.)" name="maxDiff">
                <InputNumber
                  precision={2}
                  step={0.01}
                  min={0}
                  placeholder="0"
                  suffix="%"
                  style={{ width: "fit-content" }}
                />
              </Form.Item>
            </div>
          </Form>
        </Card>
      </div>
      <div className="mt-8 lg:col-span-2">
        <Card title="Event Log" className="w-96 lg:w-full">
          <Table<logType>
            columns={columns}
            dataSource={[...logArray]}
            pagination={{ pageSize: 50 }}
            scroll={{ x: "max-content" }}
          />
        </Card>
      </div>
    </div>
  );
};

export default App;
