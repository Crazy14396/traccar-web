import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { Box, CssBaseline, IconButton, Fab } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import AddLocationIcon from '@mui/icons-material/AddLocation';

import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import { useAttributePreference } from '../common/util/preferences';

const MainMap = lazy(() => import('./MainMap'));

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: theme.palette.background.default,
  },
  container: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: theme.dimensions.drawerWidthDesktop,
    flexShrink: 0,
    transition: 'transform 0.3s ease-in-out',
    backgroundColor: theme.palette.background.paper,
    zIndex: 1300,
    position: 'relative',
    [theme.breakpoints.down('md')]: {
      width: '80%',
      maxWidth: '300px',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100%',
      boxShadow: theme.shadows[4],
    },
  },
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    width: '100%',
    position: 'relative',
  },
  mapContainer: {
    gridRow: '1 / 2',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  deviceListContainer: {
    gridRow: '2 / 3',
    overflowY: 'auto',
    backgroundColor: theme.palette.background.paper,
    height: '100%',
  },
  footer: {
    gridRow: '3 / 4',
  },
  toggleButton: {
    position: 'fixed',
    top: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 1400,
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1400,
  },
}));

const InteractiveTrackingLayout = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useDispatch();

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  const [filteredPositions, setFilteredPositions] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('filter', { statuses: [], groups: [] });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const [devicesOpen, setDevicesOpen] = useState(isDesktop);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [hoveredDeviceId, setHoveredDeviceId] = useState(null);

  const selectedPosition = filteredPositions.find(
    (pos) => selectedDeviceId && pos.deviceId === selectedDeviceId
  );

  // Toggle Sidebar
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const onEventsClick = useCallback(() => setEventsOpen(true), []);

  // Close sidebar on mobile if map is used for selection
  useEffect(() => {
    if (!isDesktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [isDesktop, mapOnSelect, selectedDeviceId]);

  // Use filter hook
  useFilter(
    keyword,
    filter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions
  );

  // Map marker hover handlers
  const handleMarkerHover = (deviceId) => {
    setHoveredDeviceId(deviceId);
  };

  const handleMarkerClick = (deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
  };

  // Center map button (example)
  const centerMap = () => {
    // You can implement map centering logic here
  };

  return (
    <Box className={classes.root}>
      <CssBaseline />

      {/* Sidebar toggle button for mobile */}
      {!isDesktop && (
        <IconButton
          color="primary"
          aria-label="Toggle menu"
          onClick={toggleSidebar}
          className={classes.toggleButton}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar */}
      <Box
        className={classes.sidebar}
        sx={{
          transform: isDesktop
            ? 'none'
            : sidebarOpen
            ? 'none'
            : 'translateX(-100%)',
        }}
      >
        <MainToolbar
          filteredDevices={filteredDevices}
          devicesOpen={devicesOpen}
          setDevicesOpen={setDevicesOpen}
          keyword={keyword}
          setKeyword={setKeyword}
          filter={filter}
          setFilter={setFilter}
          filterSort={filterSort}
          setFilterSort={setFilterSort}
          filterMap={filterMap}
          setFilterMap={setFilterMap}
        />
        <Box
          className={classes.deviceListContainer}
          role="region"
          aria-label="Device List"
        >
          <DeviceList devices={filteredDevices} />
        </Box>
      </Box>

      {/* Main content area */}
      <Box className={classes.container}>
        {/* Map */}
        <Box className={classes.mapContainer} role="region" aria-label="Map View">
          <Suspense fallback={<div>Loading Map...</div>}>
            <MainMap
              filteredPositions={filteredPositions}
              selectedPosition={selectedPosition}
              onEventsClick={onEventsClick}
              hoveredDeviceId={hoveredDeviceId}
              onMarkerHover={handleMarkerHover}
              onMarkerClick={handleMarkerClick}
            />
          </Suspense>
        </Box>

        {/* Status Card */}
        {selectedDeviceId && (
          <StatusCard
            deviceId={selectedDeviceId}
            position={selectedPosition}
            onClose={() => dispatch(devicesActions.selectId(null))}
            desktopPadding={theme.dimensions.drawerWidthDesktop}
          />
        )}

        {/* Floating Button to center map */}
        <Fab
          color="primary"
          aria-label="Center Map"
          onClick={centerMap}
          className={classes.fab}
        >
          <AddLocationIcon />
        </Fab>

        {/* Bottom Menu for mobile */}
        {!isDesktop && (
          <Box className={classes.footer}>
            <BottomMenu />
          </Box>
        )}
      </Box>

      {/* Events Drawer */}
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </Box>
  );
};

export default InteractiveTrackingLayout;
