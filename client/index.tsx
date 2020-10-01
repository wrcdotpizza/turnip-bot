import * as React from 'react';
import * as ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import {
    build,
    DailyPriceAverage,
    TurnipPrice,
    PriceDayString,
    Week
} from './api';

let userId = "d7dc44b3-ac6d-44f3-a34f-6bd6c9818563";

function App() {
    let [selectedTab, setSelectedTab] = React.useState(0);
    let [useDynamo, setUseDynamo] = React.useState(false);
    let urlPrefix = useDynamo ? 'nosql' : 'sql';
    let [api, setApi] = React.useState(build(urlPrefix));
    function rebuildApi(e) {
        urlPrefix = e.target.checked ? 'nosql': 'sql';
        setUseDynamo(e.target.checked);
        setApi(build(urlPrefix));
    }
    return (
        <>
            <AppBar position="static" color="secondary" className="app-bar">
                <div className="header">
                <span className="logo"></span>
                <Typography variant="h3" component="span" className="logo-text">
                    TURNIP BOT
                </Typography>
                <span className="toggle">SQL <Switch checked={useDynamo} onChange={rebuildApi} /> Dynamo</span>
                </div>
            </AppBar>
            <Spacer />
            <AppBar position="relative" className="tab-bar">
                <Tabs value={selectedTab} onChange={(_, tab) => setSelectedTab(tab)}>
                    <Tab label="User Stats" />
                    <Tab label="Average Price Report" />
                </Tabs>
            </AppBar>
            <Spacer />
            {selectedTab === 0 ? <Profile api={api} urlPrefix={urlPrefix} /> : <Report api={api} urlPrefix={urlPrefix} />}
        </>
    );
}

function Profile(props) {
    let { api, urlPrefix } = props;
    let [weeklyPrices, setWeeklyPrices] = React.useState<Array<Week>>([]);
    let [ selectedWeek, setSelectedWeek ] = React.useState<string>("");
    let [ priceDetail, setPriceDetail ] = React.useState<Array<TurnipPrice>>([])
    let dayRef = React.createRef();
    let windowRef = React.createRef();
    React.useEffect(() => {
        async function fetchUserWeeks() {
            let { weeks } = await api.getWeeksForUser(userId);
            setWeeklyPrices(weeks);
        }
        fetchUserWeeks();
    }, [urlPrefix, userId]);

    React.useEffect(() => {
        async function fetchPricesForWeek() {
            let { prices } = await api.getTurnipPricesForWeek(userId, selectedWeek);
            setPriceDetail(prices);
        }
        if(selectedWeek) {
            fetchPricesForWeek();
        }
    }, [urlPrefix, userId, selectedWeek]);

    async function submitIslandPrice(e) {
        let input = document.getElementById('priceInput') as HTMLInputElement;
        let { week: { weekId, price }} = await api.setWeekPriceForUser(userId, input.valueAsNumber);
        setWeeklyPrices([...weeklyPrices, { weekId, price }])
    }

    async function submitPriceDetail(e) {
        let priceInput = document.getElementById('detailPriceInput') as HTMLInputElement;
        let price = priceInput.valueAsNumber;
        let day = dayRef.current.value;
        let window = windowRef.current.value;
        const { priceId } = await api.setPriceForDay(userId, selectedWeek, price, day, window);
        setPriceDetail([...priceDetail, { priceId, price, day, window }])
    }

    function selectWeek(e) {
        setSelectedWeek(e.target.value);
    }

    return (
        <>
            <Toolbar style={{ padding: 0 }}>
                <Typography variant="h6" component="div">
                    Purchase Prices
                </Typography>
            </Toolbar>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Week</TableCell>
                            <TableCell>Price</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {weeklyPrices.map(priceInfo => (
                            <TableRow key={`week-${priceInfo.weekId}`}>
                                <TableCell>{priceInfo.weekId}</TableCell>
                                <TableCell>${priceInfo.price}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <div>
                <form noValidate autoComplete="off">
                    <TextField type="number" id="priceInput" label="Price" />
                    <Button style={{ margin: 6 }} onClick={submitIslandPrice} color="primary">
                        Create new week
                    </Button>
                </form>
            </div>
            <Spacer />
            <Toolbar style={{ padding: 0 }}>
                <Typography variant="h6" component="div">
                    Price Detail by Week
                </Typography>
            </Toolbar>
            <FormControl style={{minWidth: 120}}>
                <InputLabel id="selectWeekLabel">Select Week:</InputLabel>
                <Select labelId="selectWeekLabel" onChange={selectWeek} value={selectedWeek}>
                    {weeklyPrices.map(({weekId}) => (<MenuItem key={`select-${weekId}`} value={weekId}>{weekId}</MenuItem>))}
                </Select>
            </FormControl>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell>Window</TableCell>
                            <TableCell>Price</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {priceDetail.map(priceInfo => (
                            <TableRow key={`priceDetail-${priceInfo.priceId}`}>
                                <TableCell>                                        
                                    <span style={{ textTransform: 'capitalize', marginRight: 1 }}>
                                        {PriceDayString[priceInfo.day]}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {priceInfo.window}
                                    </span>
                                </TableCell>
                                <TableCell>${priceInfo.price}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {!!selectedWeek && <div>
                <form noValidate autoComplete="off">
                    <FormControl style={{minWidth: 120}}>
                        <InputLabel id="selectDayLabel">Select Day:</InputLabel>
                        <Select labelId="selectDayLabel" inputRef={dayRef}>
                            {Object.entries(PriceDayString).map(([code, word]) => (<MenuItem key={`selectDay-${code}`} value={code} style={{ textTransform: 'capitalize'}}>{word}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <FormControl style={{minWidth: 120}}>
                        <InputLabel id="selectWindowLabel">Select Week:</InputLabel>
                        <Select labelId="selectWindowLabel" inputRef={windowRef}>
                            <MenuItem value="am">AM</MenuItem>
                            <MenuItem value="pm">PM</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField type="number" id="detailPriceInput" label="Price" />
                    <Button style={{ margin: 6 }} onClick={submitPriceDetail} color="primary">
                        Add Price Info
                    </Button>
                </form>
            </div>}
        </>
    );
}

function Report(props) {
    let { api, urlPrefix } = props;
    let [reportInfo, setReportInfo] = React.useState<Array<DailyPriceAverage>>([]);
    
    React.useEffect(() => {
        async function fetchReport() {
            let { report } = await api.getReport();
            setReportInfo(report);
        }
        fetchReport();
    }, [urlPrefix, userId]);
    return (
        <>
            <Toolbar style={{ padding: 0 }}>
                <Typography variant="h6" component="div">
                    Average Daily Prices
                </Typography>
            </Toolbar>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell>Average Price</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reportInfo.map(priceInfo => {
                            let { averagePrice, day, priceWindow } = priceInfo;
                            return (
                                <TableRow key={`day-${day}${priceWindow}`}>
                                    <TableCell>
                                        <span style={{ textTransform: 'capitalize', marginRight: 1 }}>
                                            {PriceDayString[day]}
                                        </span>
                                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                                            {priceWindow}
                                        </span>
                                    </TableCell>
                                    <TableCell>${averagePrice.toFixed(2)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}

function Spacer() {
    return <div style={{ marginTop: 16 }}>&nbsp;</div>;
}

let root = document.getElementById('root');

ReactDOM.render(<App />, root);
