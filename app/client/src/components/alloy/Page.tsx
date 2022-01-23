import React from "react";

import Icon from "components/alloy/Icon";
import Button from "components/alloy/Button";
import { ButtonGroup } from "@chakra-ui/react";
import IconButton from "components/alloy/IconButton";
import AddFillIcon from "remixicon-react/AddFillIcon";
import SearchLineIcon from "remixicon-react/SearchLineIcon";
import EyeIcon from "remixicon-react/EyeLineIcon";
import SendIcon from "assets/icons/comments/send-button.svg";

function AlloyPage() {
  return (
    <div className="container min-h-screen pt-12 mx-auto">
      <h1 className="mt-12 space-y-8 text-3xl font-bold">
        Alloy Design System
      </h1>

      <div className="space-y-5">
        <div className="mt-5">
          <h2 className="my-2 text-xl font-semibold">Buttons</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">Sizes</h3>
              <div className="flex space-x-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Variant</h3>
              <div className="flex space-x-3">
                <Button variant="primary">Default</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="solid">Solid</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="unstyled">Unstyled</Button>
                <Button variant="unstyled">Disabled</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Disabled</h3>
              <div className="flex space-x-3">
                <Button disabled variant="primary">
                  Default
                </Button>
                <Button disabled variant="outline">
                  Outline
                </Button>
                <Button disabled variant="solid">
                  Solid
                </Button>
                <Button disabled variant="ghost">
                  Ghost
                </Button>
                <Button disabled variant="unstyled">
                  Unstyled
                </Button>
                <Button disabled variant="unstyled">
                  Disabled
                </Button>
                <Button disabled variant="link">
                  Link
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">With Icons</h3>
              <div className="flex space-x-3">
                <Button
                  rightIcon={<Icon name="plus" size="sm" />}
                  variant="primary"
                >
                  Add
                </Button>
                <Button
                  leftIcon={<Icon name="plus" size="sm" />}
                  variant="outline"
                >
                  Search
                </Button>
                <Button
                  rightIcon={<Icon name="plus" size="sm" />}
                  variant="solid"
                >
                  Solid
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ICON BUTTONS */}
        <div className="">
          <h2 className="my-2 text-xl font-semibold">Icon Button</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">Sizes</h3>
              <div className="flex space-x-3">
                <IconButton
                  aria-label="Small"
                  icon={<Icon name="plus" size="sm" />}
                  size="sm"
                >
                  Small
                </IconButton>
                <IconButton
                  aria-label="Small"
                  icon={<Icon name="plus" />}
                  size="md"
                >
                  Small
                </IconButton>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Variant</h3>
              <div className="flex space-x-3">
                <IconButton aria-label="Small" icon={<AddFillIcon />}>
                  Small
                </IconButton>
                <IconButton
                  aria-label="Small"
                  icon={<AddFillIcon />}
                  variant="outline"
                >
                  Small
                </IconButton>
                <IconButton
                  aria-label="Solid"
                  icon={<AddFillIcon />}
                  variant="solid"
                >
                  Small
                </IconButton>
                <IconButton
                  aria-label="Solid"
                  icon={<AddFillIcon />}
                  variant="ghost"
                >
                  Small
                </IconButton>
              </div>
            </div>
          </div>
        </div>

        {/* BUTTON GROUPS */}
        <div>
          <h2 className="my-2 text-xl font-semibold">Button Group</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">Sizes</h3>
              <div className="flex space-x-3">
                <ButtonGroup isAttached size="sm">
                  <Button>Save</Button>
                  <Button>Logout</Button>
                </ButtonGroup>
                <ButtonGroup isAttached size="md">
                  <Button mr="-px">Save</Button>
                  <Button>Logout</Button>
                </ButtonGroup>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Variants</h3>
              <div className="flex space-x-3">
                <ButtonGroup isAttached variant="primary">
                  <Button>Save</Button>
                  <Button>Logout</Button>
                </ButtonGroup>
                <ButtonGroup isAttached variant="outline">
                  <Button mr="-px">Save</Button>
                  <Button>Logout</Button>
                </ButtonGroup>
                <ButtonGroup isAttached variant="solid">
                  <Button mr="-px">Save</Button>
                  <Button>Logout</Button>
                </ButtonGroup>
                <ButtonGroup isAttached variant="ghost">
                  <Button mr="-px">Save</Button>
                  <Button>Logout</Button>
                </ButtonGroup>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">With Icons</h3>
              <div className="flex space-x-3">
                <ButtonGroup isAttached size="sm" variant="primary">
                  <Button>Save</Button>
                  <IconButton
                    aria-label="Small"
                    icon={<Icon aria-label="Small" name="plus" size="sm" />}
                  >
                    Small
                  </IconButton>
                </ButtonGroup>
                <ButtonGroup isAttached variant="primary">
                  <Button>Save</Button>
                  <IconButton
                    aria-label="Small"
                    icon={<Icon aria-label="Small" name="plus" size="md" />}
                  >
                    Small
                  </IconButton>
                </ButtonGroup>
                <ButtonGroup isAttached variant="outline">
                  <Button mr="-px">Save</Button>
                  <IconButton
                    aria-label="Small"
                    icon={<Icon aria-label="Small" name="plus" size="md" />}
                  >
                    Small
                  </IconButton>
                </ButtonGroup>
                <ButtonGroup isAttached variant="ghost">
                  <Button mr="-px">Save</Button>
                  <IconButton
                    aria-label="Small"
                    icon={<Icon aria-label="Small" name="plus" size="md" />}
                  >
                    Small
                  </IconButton>
                </ButtonGroup>
              </div>
            </div>
          </div>
        </div>

        {/* ICON */}
        <div className="">
          <h2 className="my-2 text-xl font-semibold">Icon Button</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">Sizes</h3>
              <div className="flex space-x-3">
                <Icon aria-label="Small" name="plus" size="sm">
                  Small
                </Icon>
                <Icon aria-label="Small" name="plus" size="md">
                  Small
                </Icon>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Custom</h3>
              <div className="flex space-x-3">
                <Icon
                  aria-label="Small"
                  bg="green.700"
                  color="white"
                  fontSize="4xl"
                  name="plus"
                  p={8}
                  rounded="full"
                >
                  Small
                </Icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlloyPage;
