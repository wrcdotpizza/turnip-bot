import * as React from 'react';
import * as ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
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
    getReport,
    getWeeksForUser,
    setWeekPriceForUser,
    DailyPriceAverage,
    PriceDay,
    PriceDayString,
    Week,
} from './api';

let userId = 1;

function App() {
    let [selectedTab, setSelectedTab] = React.useState(0);
    let [useDyanmo, setUseDynamo] = React.useState(false);
    return (
        <>
            <AppBar position="static" color="secondary">
                <Typography variant="h3">TURNIP BOT</Typography>
                SQL <Switch checked={useDyanmo} onChange={e => setUseDynamo(e.target.checked)} /> Dynamo
            </AppBar>
            <Spacer />
            <AppBar position="relative">
                <Tabs value={selectedTab} onChange={(_, tab) => setSelectedTab(tab)}>
                    <Tab label="User Stats" />
                    <Tab label="Average Price Report" />
                </Tabs>
            </AppBar>
            <Spacer />
            {selectedTab === 0 ? <Profile /> : <Report />}
        </>
    );
}

function Profile() {
    let [weeklyPrices, setWeeklyPrices] = React.useState<Array<Week>>([]);
    React.useEffect(() => {
        async function fetchUserWeeks() {
            let { weeks } = await getWeeksForUser(userId);
            setWeeklyPrices(weeks);
        }
        fetchUserWeeks();
    }, [userId]);

    async function submitIslandPrice(e) {
        let input = document.getElementById('priceInput') as HTMLInputElement;
        let response = await setWeekPriceForUser(userId, input.valueAsNumber);
        console.log('RESPONSE', response);
    }

    return (
        <>
            <Toolbar style={{ padding: 0 }}>
                <Typography variant="h6" component="div">
                    Island Prices by Week
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
            <Toolbar style={{ padding: 0 }}>
                <Typography variant="h6" component="div">
                    Set Island Price for This Week
                </Typography>
            </Toolbar>
            <div>
                <form noValidate autoComplete="off">
                    <TextField type="number" id="priceInput" label="Price" />
                    <Button style={{ margin: 6 }} onClick={submitIslandPrice} color="primary" variant="contained">
                        Submit Price
                    </Button>
                </form>
            </div>
        </>
    );
}

function Report() {
    let [reportInfo, setReportInfo] = React.useState<Array<DailyPriceAverage>>([]);
    React.useEffect(() => {
        async function fetchReport() {
            let { report } = await getReport();
            console.log(report);
            setReportInfo(report);
        }
        fetchReport();
    }, [userId]);
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
                                    <TableCell>${priceInfo.averagePrice.toFixed(2)}</TableCell>
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
