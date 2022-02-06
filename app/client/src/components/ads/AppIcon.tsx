import React, { useMemo } from "react";
import { ReactComponent as BagIcon } from "assets/icons/ads/app-icons/bag.svg";
import { ReactComponent as ProductIcon } from "assets/icons/ads/app-icons/product.svg";
import { ReactComponent as BookIcon } from "assets/icons/ads/app-icons/book.svg";
import { ReactComponent as CameraIcon } from "assets/icons/ads/app-icons/camera.svg";
import { ReactComponent as FileIcon } from "assets/icons/ads/app-icons/file.svg";
import { ReactComponent as ChatIcon } from "assets/icons/ads/app-icons/chat.svg";
import { ReactComponent as CalenderIcon } from "assets/icons/ads/app-icons/calender.svg";
import { ReactComponent as FrameIcon } from "assets/icons/ads/app-icons/frame.svg";
import { ReactComponent as GlobeIcon } from "assets/icons/ads/app-icons/globe.svg";
import { ReactComponent as ShopperIcon } from "assets/icons/ads/app-icons/shopper.svg";
import { ReactComponent as HeartIcon } from "assets/icons/ads/app-icons/heart.svg";
import { ReactComponent as FlightIcon } from "assets/icons/ads/app-icons/flight.svg";
import { ReactComponent as AlienIcon } from "assets/icons/ads/app-icons/alien.svg";
import { ReactComponent as BarGraphIcon } from "assets/icons/ads/app-icons/bar-graph.svg";
import { ReactComponent as BasketballIcon } from "assets/icons/ads/app-icons/basketball.svg";
import { ReactComponent as BicycleIcon } from "assets/icons/ads/app-icons/bicycle.svg";
import { ReactComponent as BirdIcon } from "assets/icons/ads/app-icons/bird.svg";
import { ReactComponent as BitcoinIcon } from "assets/icons/ads/app-icons/bitcoin.svg";
import { ReactComponent as BurgerIcon } from "assets/icons/ads/app-icons/burger.svg";
import { ReactComponent as BusIcon } from "assets/icons/ads/app-icons/bus.svg";
import { ReactComponent as AirplaneIcon } from "assets/icons/ads/app-icons/airplane.svg";
import { ReactComponent as CallIcon } from "assets/icons/ads/app-icons/call.svg";
import { ReactComponent as CarIcon } from "assets/icons/ads/app-icons/car.svg";
import { ReactComponent as CardIcon } from "assets/icons/ads/app-icons/card.svg";
import { ReactComponent as CatIcon } from "assets/icons/ads/app-icons/cat.svg";
import { ReactComponent as ChineseRemnibiIcon } from "assets/icons/ads/app-icons/chinese-remnibi.svg";
import { ReactComponent as CloudIcon } from "assets/icons/ads/app-icons/cloud.svg";
import { ReactComponent as CodingIcon } from "assets/icons/ads/app-icons/coding.svg";
import { ReactComponent as CouplesIcon } from "assets/icons/ads/app-icons/couples.svg";
import { ReactComponent as CricketIcon } from "assets/icons/ads/app-icons/cricket.svg";
import { ReactComponent as DiamondIcon } from "assets/icons/ads/app-icons/diamond.svg";
import { ReactComponent as DogIcon } from "assets/icons/ads/app-icons/dog.svg";
import { ReactComponent as DollarIcon } from "assets/icons/ads/app-icons/dollar.svg";
import { ReactComponent as EarthIcon } from "assets/icons/ads/app-icons/earth.svg";
import { ReactComponent as EmailIcon } from "assets/icons/ads/app-icons/email.svg";
import { ReactComponent as EurosIcon } from "assets/icons/ads/app-icons/euros.svg";
import { ReactComponent as FamilyIcon } from "assets/icons/ads/app-icons/family.svg";
import { ReactComponent as FlagIcon } from "assets/icons/ads/app-icons/flag.svg";
import { ReactComponent as FootballIcon } from "assets/icons/ads/app-icons/football.svg";
import { ReactComponent as HatIcon } from "assets/icons/ads/app-icons/hat.svg";
import { ReactComponent as HeadphonesIcon } from "assets/icons/ads/app-icons/headphones.svg";
import { ReactComponent as HospitalIcon } from "assets/icons/ads/app-icons/hospital.svg";
import { ReactComponent as JoystickIcon } from "assets/icons/ads/app-icons/joystick.svg";
import { ReactComponent as LaptopIcon } from "assets/icons/ads/app-icons/laptop.svg";
import { ReactComponent as LineChartIcon } from "assets/icons/ads/app-icons/line-chart.svg";
import { ReactComponent as LocationIcon } from "assets/icons/ads/app-icons/location.svg";
import { ReactComponent as LotusIcon } from "assets/icons/ads/app-icons/lotus.svg";
import { ReactComponent as LoveIcon } from "assets/icons/ads/app-icons/love.svg";
import { ReactComponent as MedalIcon } from "assets/icons/ads/app-icons/medal.svg";
import { ReactComponent as MedicalIcon } from "assets/icons/ads/app-icons/medical.svg";
import { ReactComponent as MoneyIcon } from "assets/icons/ads/app-icons/money.svg";
import { ReactComponent as MoonIcon } from "assets/icons/ads/app-icons/moon.svg";
import { ReactComponent as MugIcon } from "assets/icons/ads/app-icons/mug.svg";
import { ReactComponent as MusicIcon } from "assets/icons/ads/app-icons/music.svg";
import { ReactComponent as PantsIcon } from "assets/icons/ads/app-icons/pants.svg";
import { ReactComponent as PieChartIcon } from "assets/icons/ads/app-icons/pie-chart.svg";
import { ReactComponent as PizzaIcon } from "assets/icons/ads/app-icons/pizza.svg";
import { ReactComponent as PlantIcon } from "assets/icons/ads/app-icons/plant.svg";
import { ReactComponent as RainyWeatherIcon } from "assets/icons/ads/app-icons/rainy-weather.svg";
import { ReactComponent as RestaurantIcon } from "assets/icons/ads/app-icons/restaurant.svg";
import { ReactComponent as RocketIcon } from "assets/icons/ads/app-icons/rocket.svg";
import { ReactComponent as RoseIcon } from "assets/icons/ads/app-icons/rose.svg";
import { ReactComponent as RupeeIcon } from "assets/icons/ads/app-icons/rupee.svg";
import { ReactComponent as SaturnIcon } from "assets/icons/ads/app-icons/saturn.svg";
import { ReactComponent as ServerIcon } from "assets/icons/ads/app-icons/server.svg";
import { ReactComponent as ShakeHandsIcon } from "assets/icons/ads/app-icons/shake-hands.svg";
import { ReactComponent as ShirtIcon } from "assets/icons/ads/app-icons/shirt.svg";
import { ReactComponent as ShopIcon } from "assets/icons/ads/app-icons/shop.svg";
import { ReactComponent as SinglePersonIcon } from "assets/icons/ads/app-icons/single-person.svg";
import { ReactComponent as SmartphoneIcon } from "assets/icons/ads/app-icons/smartphone.svg";
import { ReactComponent as SnowyWeatherIcon } from "assets/icons/ads/app-icons/snowy-weather.svg";
import { ReactComponent as StarsIcon } from "assets/icons/ads/app-icons/stars.svg";
import { ReactComponent as SunflowerIcon } from "assets/icons/ads/app-icons/sunflower.svg";
import { ReactComponent as SystemIcon } from "assets/icons/ads/app-icons/system.svg";
import { ReactComponent as TeamIcon } from "assets/icons/ads/app-icons/team.svg";
import { ReactComponent as TreeIcon } from "assets/icons/ads/app-icons/tree.svg";
import { ReactComponent as UkPoundsIcon } from "assets/icons/ads/app-icons/uk-pounds.svg";
import { ReactComponent as WebsiteIcon } from "assets/icons/ads/app-icons/website.svg";
import { ReactComponent as YenIcon } from "assets/icons/ads/app-icons/yen.svg";
import { ReactComponent as SteamBowlIcon } from "assets/icons/ads/app-icons/steam-bowl.svg";
import ArrowDownIcon from "remixicon-react/ArrowDownSLineIcon";
import ArrowUpIcon from "remixicon-react/ArrowUpSLineIcon";
import ArrowLeftIcon from "remixicon-react/ArrowLeftSLineIcon";
import ArrowRightIcon from "remixicon-react/ArrowRightSLineIcon";
import HelpIcon from "remixicon-react/QuestionLineIcon";
import OpenNewTabIcon from "remixicon-react/ShareBoxLineIcon";

import styled from "styled-components";
import { Size } from "./Button";
import { CommonComponentProps, Classes } from "./common";

export const AppIconCollection = [
  "bag",
  "product",
  "book",
  "camera",
  "file",
  "chat",
  "calender",
  "flight",
  "frame",
  "globe",
  "shopper",
  "heart",
  "alien",
  "bar-graph",
  "basketball",
  "bicycle",
  "bird",
  "bitcoin",
  "burger",
  "bus",
  "call",
  "car",
  "card",
  "cat",
  "chinese-remnibi",
  "cloud",
  "coding",
  "couples",
  "cricket",
  "diamond",
  "dog",
  "dollar",
  "earth",
  "email",
  "euros",
  "family",
  "flag",
  "football",
  "hat",
  "headphones",
  "hospital",
  "joystick",
  "laptop",
  "line-chart",
  "location",
  "lotus",
  "love",
  "medal",
  "medical",
  "money",
  "moon",
  "mug",
  "music",
  "pants",
  "pie-chart",
  "pizza",
  "plant",
  "rainy-weather",
  "restaurant",
  "rocket",
  "rose",
  "rupee",
  "saturn",
  "server",
  "shake-hands",
  "shirt",
  "shop",
  "single-person",
  "smartphone",
  "snowy-weather",
  "stars",
  "steam-bowl",
  "sunflower",
  "system",
  "team",
  "tree",
  "uk-pounds",
  "website",
  "yen",
  "airplane",
  "arrow-down",
  "arrow-up",
  "arrow-left",
  "arrow-right",
  "help",
  "open-new-tab",
] as const;

export type AppIconName = typeof AppIconCollection[number];

type cssAttributes = {
  width: number;
  height: number;
  padding: number;
};

const appSizeHandler = (size: Size): cssAttributes => {
  let width, height, padding;
  switch (size) {
    case Size.small:
      width = 20;
      height = 20;
      padding = 5;
      break;
    case Size.medium:
      width = 32;
      height = 32;
      padding = 20;
      break;
    case Size.large:
      width = 50;
      height = 50;
      padding = 50;
      break;
    default:
      width = 20;
      height = 20;
      padding = 5;
      break;
  }
  return { width, height, padding };
};

const IconWrapper = styled.a<AppIconProps & { styledProps: cssAttributes }>`
  cursor: pointer;
  width: ${(props) => props.styledProps.width}px;
  height: ${(props) => props.styledProps.height}px;
  &:focus {
    outline: none;
  }
  svg {
    width: ${(props) => props.styledProps.width}px;
    height: ${(props) => props.styledProps.height}px;
    path {
      fill: ${(props) => props.theme.colors.appIcon.normal};
    }
  }
`;

export type AppIconProps = CommonComponentProps & {
  size?: Size;
  name: AppIconName;
  onClick?: (e: any) => void;
};

function AppIcon(props: AppIconProps) {
  const styledProps = useMemo(() => appSizeHandler(props.size || Size.medium), [
    props,
  ]);

  let returnIcon;
  switch (props.name) {
    case "bag":
      returnIcon = <BagIcon />;
      break;
    case "product":
      returnIcon = <ProductIcon />;
      break;
    case "book":
      returnIcon = <BookIcon />;
      break;
    case "camera":
      returnIcon = <CameraIcon />;
      break;
    case "file":
      returnIcon = <FileIcon />;
      break;
    case "chat":
      returnIcon = <ChatIcon />;
      break;
    case "calender":
      returnIcon = <CalenderIcon />;
      break;
    case "frame":
      returnIcon = <FrameIcon />;
      break;
    case "globe":
      returnIcon = <GlobeIcon />;
      break;
    case "shopper":
      returnIcon = <ShopperIcon />;
      break;
    case "heart":
      returnIcon = <HeartIcon />;
      break;
    case "flight":
      returnIcon = <FlightIcon />;
      break;
    case "alien":
      returnIcon = <AlienIcon />;
      break;
    case "bar-graph":
      returnIcon = <BarGraphIcon />;
      break;
    case "basketball":
      returnIcon = <BasketballIcon />;
      break;
    case "bicycle":
      returnIcon = <BicycleIcon />;
      break;
    case "bird":
      returnIcon = <BirdIcon />;
      break;
    case "bitcoin":
      returnIcon = <BitcoinIcon />;
      break;
    case "burger":
      returnIcon = <BurgerIcon />;
      break;
    case "bus":
      returnIcon = <BusIcon />;
      break;
    case "call":
      returnIcon = <CallIcon />;
      break;
    case "car":
      returnIcon = <CarIcon />;
      break;
    case "card":
      returnIcon = <CardIcon />;
      break;
    case "cat":
      returnIcon = <CatIcon />;
      break;
    case "chinese-remnibi":
      returnIcon = <ChineseRemnibiIcon />;
      break;
    case "cloud":
      returnIcon = <CloudIcon />;
      break;
    case "coding":
      returnIcon = <CodingIcon />;
      break;
    case "couples":
      returnIcon = <CouplesIcon />;
      break;
    case "cricket":
      returnIcon = <CricketIcon />;
      break;
    case "diamond":
      returnIcon = <DiamondIcon />;
      break;
    case "dog":
      returnIcon = <DogIcon />;
      break;
    case "airplane":
      returnIcon = <AirplaneIcon />;
      break;
    case "dollar":
      returnIcon = <DollarIcon />;
      break;
    case "earth":
      returnIcon = <EarthIcon />;
      break;
    case "email":
      returnIcon = <EmailIcon />;
      break;
    case "euros":
      returnIcon = <EurosIcon />;
      break;
    case "family":
      returnIcon = <FamilyIcon />;
      break;
    case "flag":
      returnIcon = <FlagIcon />;
      break;
    case "football":
      returnIcon = <FootballIcon />;
      break;
    case "hat":
      returnIcon = <HatIcon />;
      break;
    case "headphones":
      returnIcon = <HeadphonesIcon />;
      break;
    case "hospital":
      returnIcon = <HospitalIcon />;
      break;
    case "joystick":
      returnIcon = <JoystickIcon />;
      break;
    case "laptop":
      returnIcon = <LaptopIcon />;
      break;
    case "line-chart":
      returnIcon = <LineChartIcon />;
      break;
    case "location":
      returnIcon = <LocationIcon />;
      break;
    case "lotus":
      returnIcon = <LotusIcon />;
      break;
    case "love":
      returnIcon = <LoveIcon />;
      break;
    case "medal":
      returnIcon = <MedalIcon />;
      break;
    case "medical":
      returnIcon = <MedicalIcon />;
      break;
    case "money":
      returnIcon = <MoneyIcon />;
      break;
    case "moon":
      returnIcon = <MoonIcon />;
      break;
    case "mug":
      returnIcon = <MugIcon />;
      break;
    case "music":
      returnIcon = <MusicIcon />;
      break;
    case "pants":
      returnIcon = <PantsIcon />;
      break;
    case "pie-chart":
      returnIcon = <PieChartIcon />;
      break;
    case "pizza":
      returnIcon = <PizzaIcon />;
      break;
    case "plant":
      returnIcon = <PlantIcon />;
      break;
    case "rainy-weather":
      returnIcon = <RainyWeatherIcon />;
      break;
    case "restaurant":
      returnIcon = <RestaurantIcon />;
      break;
    case "rocket":
      returnIcon = <RocketIcon />;
      break;
    case "rose":
      returnIcon = <RoseIcon />;
      break;
    case "rupee":
      returnIcon = <RupeeIcon />;
      break;
    case "saturn":
      returnIcon = <SaturnIcon />;
      break;
    case "server":
      returnIcon = <ServerIcon />;
      break;
    case "shake-hands":
      returnIcon = <ShakeHandsIcon />;
      break;
    case "shirt":
      returnIcon = <ShirtIcon />;
      break;
    case "shop":
      returnIcon = <ShopIcon />;
      break;
    case "single-person":
      returnIcon = <SinglePersonIcon />;
      break;
    case "smartphone":
      returnIcon = <SmartphoneIcon />;
      break;
    case "snowy-weather":
      returnIcon = <SnowyWeatherIcon />;
      break;
    case "stars":
      returnIcon = <StarsIcon />;
      break;
    case "sunflower":
      returnIcon = <SunflowerIcon />;
      break;
    case "steam-bowl":
      returnIcon = <SteamBowlIcon />;
      break;
    case "system":
      returnIcon = <SystemIcon />;
      break;
    case "team":
      returnIcon = <TeamIcon />;
      break;
    case "tree":
      returnIcon = <TreeIcon />;
      break;
    case "uk-pounds":
      returnIcon = <UkPoundsIcon />;
      break;
    case "website":
      returnIcon = <WebsiteIcon />;
      break;
    case "yen":
      returnIcon = <YenIcon />;
      break;
    case "arrow-down":
      returnIcon = <ArrowDownIcon />;
      break;
    case "arrow-up":
      returnIcon = <ArrowUpIcon />;
      break;
    case "arrow-left":
      returnIcon = <ArrowLeftIcon />;
      break;
    case "arrow-right":
      returnIcon = <ArrowRightIcon />;
      break;
    case "help":
      returnIcon = <HelpIcon />;
      break;
    case "open-new-tab":
      returnIcon = <OpenNewTabIcon />;
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon ? (
    <IconWrapper
      data-cy={props.cypressSelector}
      {...props}
      className={[Classes.APP_ICON, props.className].join(" ")}
      styledProps={styledProps}
    >
      {returnIcon}
    </IconWrapper>
  ) : null;
}

export default AppIcon;
