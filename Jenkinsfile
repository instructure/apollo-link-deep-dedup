CHANNEL_NAME = '#new_jenkins_noisy'
pipeline {
    agent {
        docker {
            image 'node:8-alpine'
        }
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out commit....'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm run bootstrap && npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
                echo 'Testing...'
                sh 'npm run start & npm run test'
            }
        }
    }
    post {
        sh 'GIT_COMMITTER=$(git show -s --pretty=%an'
        success {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'good',
                message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) by (${env.GIT_COMMITTER}) :happystar:"
            )
        }

        failure {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'danger',
                message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) :u7981:"
            )
        }
    }
}
