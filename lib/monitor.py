# Relay control
#  -h, --help            show this help message and exit
#  -v, --verbose         verbose output
#  -g {0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21}, --gpio {0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21}
#                        define GPIO output
#  -r {0,1}, --relay {0,1}
#                        define relay state ON = 1, OFF = 0
#  -c, --clean           cleanup GPIO
#  -s, --state           read state of GPIO
# (c)bugsounet 05/09/2021 bugsounet.fr
# thanks to Turezz for helping and testing :)
#

import RPi.GPIO as GPIO
import time
import argparse, sys

parser = argparse.ArgumentParser()
parser.add_argument("-v", "--verbose",
                    help="verbose output",
                    action="store_true")
parser.add_argument("-g", "--gpio",
                    type=int, choices=[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
                    default=20,
                    help="define GPIO output")
parser.add_argument("-r", "--relay",
                    type=int, choices=[0,1],
                    default=0,
                    help="define relay state ON = 1, OFF = 0")
parser.add_argument("-c", "--clean",
                    help="cleanup GPIO",
                    action="store_true")
parser.add_argument("-s", "--state",
                    help="query state of the GPIO and exit",
                    action="store_true")

args = parser.parse_args(None if sys.argv[1:] else ['-h'])
gpio = args.gpio

if args.verbose:
    print("Used Args:")
    print("GPIO: " + str(gpio))
    print("Relay: " + str(args.relay))
    print("Cleanup: " + str(args.clean))
    print("State: " + str(args.state))


# GPIO setup
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(gpio, GPIO.OUT)

if args.state:
  print(str(GPIO.input(gpio)))
  exit()

def monitor_on(pin):
    GPIO.output(pin, GPIO.HIGH)  # Turn monitor on
    print("ON")
def monitor_off(pin):
    GPIO.output(pin, GPIO.LOW)  # Turn monitor off
    print("OFF")
if __name__ == '__main__':
    try:
        if(args.relay == 1):
          monitor_on(gpio)
        else:
          monitor_off(gpio)
        if(args.clean):
          GPIO.cleanup()
    except KeyboardInterrupt:
        GPIO.cleanup()
